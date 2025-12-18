export function buildPrompt(
  mode: 'question' | 'error' | 'review',
  query: string,
  angularVersion: string,
  learningMode = true,
) {
  // Map Angular version to Material and NgRX versions
  const versionMap: Record<string, { material: string; ngrx: string }> = {
    '18': { material: '18.x', ngrx: '18.1.0' },
    '19': { material: '19.x', ngrx: '19.0.0' },
    '20': { material: '20.x', ngrx: '20.0.1' },
    '21': { material: '21.x', ngrx: 'main' },
  };

  const normalizedVersion = angularVersion.replace('v', '');
  const isAuto = angularVersion === 'auto';
  const versions =
    versionMap[normalizedVersion] || versionMap[isAuto ? '21' : '21'];

  const versionContext = isAuto
    ? `# Role: Angular Expert
You are NgMaestro. Infer version from queries (modern → 18+; legacy → older; ambiguous → 21).
Always provide specific version to docs tools; never use "auto".`
    : `# Role: Angular ${angularVersion} Expert
You are NgMaestro.`;

  const baseSystem = `${versionContext}

## Core Directives
- **Search documentation first**: Use searchAngularDocs, searchMaterialDocs, searchNgrxDocs (min 3 queries).
- **Never invent APIs or patterns**: Only use documented features; cite the docs in your answer.
- **Anti-hallucination**: If searches yield no results, state "not found in docs" rather than guessing.
- **Verify completeness**: Confirm your answer matches the user's specific version and use case.
- Output ONLY valid JSON; no text outside schema.

## Version & Defaults
Target: Angular ${isAuto ? '21' : angularVersion} · Material: ${versions.material} · NgRX: ${versions.ngrx}

**Modern Defaults** (unless user requests legacy):
- Standalone components; Signals for state; @if/@for/@switch; inject() for DI; OnPush change detection.
`;

  const outputFormatInstructions = `
## Output
JSON only: { "blocks": [...], "confidence": { "overall_confidence": 1-10, "docs_confidence": 1-10, "answer_confidence": 1-10 } }
- "blocks" array: [{ "type": "text", "content": "markdown explanation" }, { "type": "code", "language": "typescript|html|bash|json", "content": "raw code" }]
- Keep text brief (2-4 paras); include code only if needed.
- Escape newlines as \\n in JSON strings.
`;

  const modeInstructions = {
    question: `\n## Q&A: Direct answer; search docs first.`,
    error: `\n## Error: Explain, root cause, fix, prevention.`,
    review: `\n## Review: Strengths, issues (concise), improved snippet.`,
  };

  const userPrompts = {
    question: `Q: ${query}`,
    error: `Error: ${query}`,
    review: `Code:\`\`\`typescript\n${query}\n\`\`\``,
  };

  return {
    system: baseSystem + modeInstructions[mode] + outputFormatInstructions,
    prompt: userPrompts[mode],
  };
}
