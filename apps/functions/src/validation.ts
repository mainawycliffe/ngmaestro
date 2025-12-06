import { z } from 'genkit';

/**
 * Tool call structure for validation
 */
export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

/**
 * Validation result for response quality checks
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  searchMetrics?: {
    toolCallCount: number;
    searchQueryVariety: number;
    hasMultipleAttempts: boolean;
  };
}

/**
 * Patterns that suggest potential hallucinations
 */
const HALLUCINATION_PATTERNS = [
  // Non-existent Angular APIs
  /signal-forms/i,
  /signalForms/i,

  // Generic placeholders that suggest guessing
  /\/\/ TODO:/i,
  /\/\/ implementation here/i,
  /\/\/ your code here/i,
  /\.\.\./,

  // Phrases suggesting lack of documentation
  /based on my (general )?knowledge/i,
  /according to my understanding/i,
  /i believe/i,
  /i think/i,
  /probably/i,
  /might be/i,
];

/**
 * Known deprecated APIs by version
 */
const DEPRECATED_APIS: Record<string, RegExp[]> = {
  '18': [/@NgModule/, /CUSTOM_ELEMENTS_SCHEMA/, /CommonModule(?! from)/],
  '19': [/@NgModule/, /CUSTOM_ELEMENTS_SCHEMA/],
  '20': [/@NgModule/, /CUSTOM_ELEMENTS_SCHEMA/],
  '21': [/@NgModule/, /CUSTOM_ELEMENTS_SCHEMA/],
};

/**
 * Old control flow syntax that should be flagged for v17+
 */
const OLD_CONTROL_FLOW_PATTERNS = [/\*ngIf/, /\*ngFor/, /\*ngSwitch/];

/**
 * Validate response content for hallucination patterns
 */
export function validateResponseContent(
  blocks: Array<{ type: string; content: string }>,
  angularVersion: string,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalizedVersion = angularVersion.replace('v', '');
  const versionNum = parseInt(normalizedVersion, 10);

  for (const block of blocks) {
    const content = block.content;

    // Check for hallucination patterns
    for (const pattern of HALLUCINATION_PATTERNS) {
      if (pattern.test(content)) {
        warnings.push(
          `Potential hallucination detected: Pattern "${pattern.source}" found in response`,
        );
      }
    }

    // Check for deprecated APIs
    if (DEPRECATED_APIS[normalizedVersion]) {
      for (const pattern of DEPRECATED_APIS[normalizedVersion]) {
        if (pattern.test(content)) {
          warnings.push(
            `Deprecated API detected for Angular ${normalizedVersion}: ${pattern.source}`,
          );
        }
      }
    }

    // Check for old control flow syntax in v17+
    if (versionNum >= 17) {
      for (const pattern of OLD_CONTROL_FLOW_PATTERNS) {
        if (pattern.test(content)) {
          warnings.push(
            `Old control flow syntax detected (should use @if, @for, @switch): ${pattern.source}`,
          );
        }
      }
    }

    // Check for empty content
    if (block.type === 'text' && content.trim().length < 10) {
      errors.push(
        'Text block has insufficient content (less than 10 characters)',
      );
    }

    // Check for "cannot find" responses without proper explanation
    const cannotFindPattern = /cannot find|unable to find|not found/i;
    if (cannotFindPattern.test(content) && content.length < 100) {
      errors.push(
        'Response indicates information not found but lacks detailed explanation of search attempts',
      );
    }
  }

  return { errors, warnings };
}

/**
 * Validate that search tools were called appropriately
 */
export function validateSearchBehavior(
  toolCalls: ToolCall[],
  responseContent: string,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const searchToolNames = [
    'searchAngularDocs',
    'searchMaterialDocs',
    'searchNgrxDocs',
  ];

  const searchCalls = toolCalls.filter((call) =>
    searchToolNames.includes(call.name),
  );

  // Check if any searches were performed
  if (searchCalls.length === 0) {
    const cannotFindPattern = /cannot find|unable to find|not found/i;
    const hasDetailedResponse = responseContent.length > 200;

    if (cannotFindPattern.test(responseContent)) {
      errors.push(
        'Response claims information not found but no search tools were called',
      );
    } else if (hasDetailedResponse) {
      warnings.push(
        'Detailed response provided without calling any search tools - possible hallucination',
      );
    }
  }

  // Check for minimum search attempts
  if (searchCalls.length > 0 && searchCalls.length < 2) {
    const cannotFindPattern = /cannot find|unable to find|not found/i;
    if (cannotFindPattern.test(responseContent)) {
      warnings.push(
        'Only 1 search attempt made before claiming information not found (should try 2-3 variations)',
      );
    }
  }

  // Check for query variety
  const uniqueQueries = new Set(
    searchCalls.map((call) => call.input?.query || ''),
  );
  if (searchCalls.length >= 2 && uniqueQueries.size === 1) {
    warnings.push(
      'Multiple searches made but with identical queries - should try different search terms',
    );
  }

  return { errors, warnings };
}

/**
 * Enhanced Zod schema with quality validations
 */
export const validatedOracleResponseSchema = z
  .object({
    blocks: z
      .array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('text'),
            content: z.string().min(1, 'Text content cannot be empty'),
          }),
          z.object({
            type: z.literal('code'),
            language: z.string().min(1, 'Language must be specified'),
            content: z.string().min(1, 'Code content cannot be empty'),
            filename: z.string().optional(),
          }),
        ]),
      )
      .min(1, 'Response must contain at least one block'),
  })
  .refine(
    (data) => {
      // Ensure at least one text block exists
      return data.blocks.some((block) => block.type === 'text');
    },
    {
      message: 'Response must contain at least one text explanation block',
    },
  )
  .refine(
    (data) => {
      // Check total content length
      const totalLength = data.blocks.reduce(
        (sum, block) => sum + block.content.length,
        0,
      );
      return totalLength >= 50;
    },
    {
      message: 'Response content is too short (less than 50 characters total)',
    },
  )
  .refine(
    (data) => {
      // CRITICAL: Ensure code blocks are always accompanied by text explanations
      // Check if response contains ONLY code blocks without any substantial text
      const hasCodeBlocks = data.blocks.some((block) => block.type === 'code');
      const textBlocks = data.blocks.filter((block) => block.type === 'text');
      const substantialTextLength = textBlocks.reduce(
        (sum, block) => sum + block.content.length,
        0,
      );

      // If there are code blocks, there must be substantial text (at least 200 chars)
      if (hasCodeBlocks && substantialTextLength < 200) {
        return false;
      }

      return true;
    },
    {
      message:
        'Code blocks must be accompanied by substantial text explanation (at least 200 characters)',
    },
  )
  .refine(
    (data) => {
      // Ensure text explanation comes BEFORE code blocks
      let hasSeenCode = false;
      let hasTextBeforeCode = false;

      for (const block of data.blocks) {
        if (block.type === 'text' && !hasSeenCode) {
          hasTextBeforeCode = true;
        }
        if (block.type === 'code') {
          hasSeenCode = true;
        }
      }

      // If there are code blocks, ensure there's explanatory text first
      if (hasSeenCode && !hasTextBeforeCode) {
        return false;
      }

      return true;
    },
    {
      message:
        'Code blocks must be preceded by text explanation - do not start response with code',
    },
  );

/**
 * Comprehensive validation function
 */
export function validateResponse(
  response: { blocks: Array<{ type: string; content: string }> },
  angularVersion: string,
  toolCalls: ToolCall[] = [],
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // 1. Schema validation (basic structure)
  const schemaValidation = validatedOracleResponseSchema.safeParse(response);
  if (!schemaValidation.success) {
    schemaValidation.error.issues.forEach((issue) => {
      allErrors.push(`Schema validation: ${issue.message}`);
    });
  }

  // 2. Content validation (hallucination patterns, deprecated APIs)
  const responseText = response.blocks.map((b) => b.content).join('\n');
  const { errors: contentErrors, warnings: contentWarnings } =
    validateResponseContent(response.blocks, angularVersion);
  allErrors.push(...contentErrors);
  allWarnings.push(...contentWarnings);

  // 3. Search behavior validation
  const { errors: searchErrors, warnings: searchWarnings } =
    validateSearchBehavior(toolCalls, responseText);
  allErrors.push(...searchErrors);
  allWarnings.push(...searchWarnings);

  // 4. Search metrics
  const searchToolNames = [
    'searchAngularDocs',
    'searchMaterialDocs',
    'searchNgrxDocs',
  ];
  const searchCalls = toolCalls.filter((call) =>
    searchToolNames.includes(call.name),
  );
  const uniqueQueries = new Set(
    searchCalls.map((call) => call.input?.query || ''),
  );

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    searchMetrics: {
      toolCallCount: searchCalls.length,
      searchQueryVariety: uniqueQueries.size,
      hasMultipleAttempts: searchCalls.length >= 2,
    },
  };
}
