import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BugReportService } from '../services/bug-report.service';
import { BugReportDialogComponent } from './bug-report-dialog.component';

@Component({
  selector: 'app-bug-report',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      mat-icon-button
      (click)="openReportDialog()"
      matTooltip="Report an issue"
      color="warn"
    >
      <mat-icon>bug_report</mat-icon>
    </button>
  `,
})
export class BugReportComponent {
  query = input.required<string>();
  angularVersion = input.required<string>();
  mode = input.required<'question' | 'error' | 'review'>();
  response = input.required<{
    blocks: Array<
      | { type: 'text'; content: string }
      | { type: 'code'; language: string; content: string; filename?: string }
    >;
  }>();

  private dialog = inject(MatDialog);
  private bugReportService = inject(BugReportService);

  openReportDialog() {
    const dialogRef = this.dialog.open(BugReportDialogComponent, {
      width: '600px',
      data: {
        query: this.query(),
        angularVersion: this.angularVersion(),
        mode: this.mode(),
        response: this.response(),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.bugReportService.reportBug({
          query: this.query(),
          angularVersion: this.angularVersion(),
          mode: this.mode(),
          issueType: result.issueType,
          description: result.description,
          response: this.response(),
        });
      }
    });
  }
}
