import { Injectable } from '@angular/core';

export interface BugReportData {
  query: string;
  angularVersion: string;
  mode: 'question' | 'error' | 'review';
  issueType:
    | 'incorrect_response'
    | 'hallucination'
    | 'missing_docs'
    | 'formatting_error'
    | 'other';
  description: string;
  response?: {
    blocks: Array<
      | { type: 'text'; content: string }
      | { type: 'code'; language: string; content: string; filename?: string }
    >;
  };
}

@Injectable({
  providedIn: 'root',
})
export class BugReportService {
  private readonly GITHUB_REPO = 'mainawycliffe/ngmaestro';
  private readonly GITHUB_ISSUES_URL = `https://github.com/${this.GITHUB_REPO}/issues/new`;

  /**
   * Generate GitHub issue URL with pre-filled template
   */
  private generateIssueUrl(data: BugReportData): string {
    const labels = this.getLabelsForIssueType(data.issueType);

    const title = `[Bug Report] ${this.getIssueTitlePrefix(data.issueType)}: ${data.query.substring(0, 80)}`;

    const body = this.generateIssueBody(data);

    const params = new URLSearchParams({
      title,
      body,
      labels: labels.join(','),
    });

    return `${this.GITHUB_ISSUES_URL}?${params.toString()}`;
  }

  /**
   * Get labels based on issue type
   */
  private getLabelsForIssueType(
    issueType: BugReportData['issueType'],
  ): string[] {
    const labelMap: Record<BugReportData['issueType'], string[]> = {
      incorrect_response: ['bug', 'incorrect-response'],
      hallucination: ['bug', 'hallucination'],
      missing_docs: ['documentation', 'enhancement'],
      formatting_error: ['bug', 'formatting'],
      other: ['bug'],
    };

    return labelMap[issueType];
  }

  /**
   * Get issue title prefix
   */
  private getIssueTitlePrefix(issueType: BugReportData['issueType']): string {
    const prefixMap: Record<BugReportData['issueType'], string> = {
      incorrect_response: 'Incorrect Response',
      hallucination: 'Hallucination Detected',
      missing_docs: 'Missing Documentation',
      formatting_error: 'Formatting Error',
      other: 'Issue',
    };

    return prefixMap[issueType];
  }

  /**
   * Generate formatted issue body
   */
  private generateIssueBody(data: BugReportData): string {
    let body = `## Issue Description\n\n${data.description}\n\n`;

    body += `## Context\n\n`;
    body += `- **Query**: ${data.query}\n`;
    body += `- **Angular Version**: ${data.angularVersion}\n`;
    body += `- **Mode**: ${data.mode}\n`;
    body += `- **Issue Type**: ${data.issueType}\n\n`;

    if (data.response && data.response.blocks.length > 0) {
      body += `## Generated Response\n\n`;

      for (const block of data.response.blocks) {
        if (block.type === 'text') {
          body += `${block.content}\n\n`;
        } else if (block.type === 'code') {
          body += `\`\`\`${block.language}\n${block.content}\n\`\`\`\n\n`;
        }
      }
    }

    body += `---\n\n`;
    body += `*This issue was auto-generated from the NgMaestro UI*`;

    return body;
  }

  /**
   * Open GitHub issue in new tab
   */
  reportBug(data: BugReportData): void {
    const issueUrl = this.generateIssueUrl(data);
    window.open(issueUrl, '_blank', 'noopener,noreferrer');
  }
}
