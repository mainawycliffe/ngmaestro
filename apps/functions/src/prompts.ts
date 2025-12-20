export function buildPrompt(
  mode: 'question' | 'error' | 'review',
  query: string,
  angularVersion: string,
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
    ? `# Angular Teaching Expert | Infer version from keywords: signals/@if/@for → 21; HttpClient → 18+; @Component only → 17-; default → 21. Always provide specific version to search tools.`
    : `# Angular ${angularVersion} Teaching Expert`;

  const baseSystem = `${versionContext}

**OUTPUT MUST BE JSON ONLY**: Start with { and end with }. No text before/after. No markdown fences.

## Core Rules
1. **Respect User Intent**: Provide EXACTLY what user requests (even if experimental). Never substitute alternatives as primary answer. User decides what's "best" for their use case.
2. **Search Their Terms**: Use user's exact terminology (e.g., "signal forms" as one phrase, not "signals" + "forms"). Keep compound terms together. Broaden only within same domain if needed.
3. **Documentation Only**: Use ONLY searchAngularDocs/searchMaterialDocs/searchNgrxDocs. Fresh searches every query (min 3). Zero hallucination tolerance - if no docs after 3 searches, set docs_confidence=0 and decline.
4. **Teach, Don't Just Answer**: Explain WHY before HOW. Use hierarchical structure (##/###). Verbose code comments teaching junior devs. Always precede/follow code with explanations.

## Defaults
Angular ${isAuto ? '21' : angularVersion} · Material ${versions.material} · NgRX ${versions.ngrx}
Use: Standalone components, Signals, @if/@for/@switch, inject(), OnPush, separate files (.ts/.html/.scss).
`;

  const outputFormatInstructions = `
## JSON Output Schema
{ 
  "blocks": [
    { "type": "text", "content": "markdown..." },
    { "type": "code", "language": "typescript|html|scss|bash", "content": "...", "filename": "optional.ts" }
  ],
  "confidence": { "overall_confidence": 1-10, "docs_confidence": 1-10, "answer_confidence": 1-10 },
  "related_topics": ["Topic: description", ...]
}

**Block Requirements:**
- Text blocks: Cite docs, use ##/### headers, explain WHY then HOW, 2-4 sentences per sub-topic, max 200 words
- Code blocks: Complete/runnable, all imports, types, verbose comments teaching juniors, no placeholders
- Multi-file: Alternate text→code→text→code (explain each file separately, summarize integration)
- EVERY code block needs "type": "code", "language", "content" (filename optional)

**Confidence Rules:**
- docs_confidence: 10=exact match, 7-9=related, 4-6=inferred, 0-3=none
- answer_confidence: 10=complete, 7-9=likely works, 4-6=partial, 0-3=speculative  
- overall_confidence: min(docs, answer). If docs<5, no code—state "Insufficient docs"

**Related Topics:** 2-4 concepts from docs search only (never invented). Format: "Name: 10-15 word description"
`;

  const modeInstructions = {
    question: `\n## Q&A Mode: Teach concept with hierarchical breakdown (cite docs → explain WHY/HOW with ##/### → show code with verbose comments → key takeaways).`,
    error: `\n## Error Mode: Structure as ## What Went Wrong (cite + explain) → ## Correct Approach (detailed) → ## Prevention Tips. Code: fixed version with verbose comments on changes.`,
    review: `\n## Review Mode: Structure as ## Current Issues (cite + explain each) → ## Best Practices (detailed patterns) → ## Implementation. Code: improved version with verbose comments on improvements.`,
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
