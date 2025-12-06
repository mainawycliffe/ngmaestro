import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface BugReportDialogData {
  query: string;
  angularVersion: string;
  mode: 'question' | 'error' | 'review';
  response: {
    blocks: Array<
      | { type: 'text'; content: string }
      | { type: 'code'; language: string; content: string; filename?: string }
    >;
  };
}

@Component({
  selector: 'app-bug-report-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Report an Issue</h2>
    <mat-dialog-content>
      <form [formGroup]="reportForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Issue Type</mat-label>
          <mat-select formControlName="issueType" required>
            <mat-option value="incorrect_response"
              >Incorrect Response</mat-option
            >
            <mat-option value="hallucination"
              >Hallucination (Made-up APIs)</mat-option
            >
            <mat-option value="missing_docs">Missing Documentation</mat-option>
            <mat-option value="formatting_error">Formatting Error</mat-option>
            <mat-option value="other">Other</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="6"
            placeholder="Describe the issue in detail..."
            required
          ></textarea>
          <mat-hint>This will be included in the GitHub issue</mat-hint>
        </mat-form-field>
      </form>

      <div class="info-message">
        <p>
          This will open a new GitHub issue with your report. The issue will
          include:
        </p>
        <ul>
          <li>Your description</li>
          <li>The original query</li>
          <li>The generated response</li>
          <li>Context (Angular version, mode, etc.)</li>
        </ul>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        (click)="submit()"
        [disabled]="reportForm.invalid"
      >
        Open GitHub Issue
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    .info-message {
      background: #f5f5f5;
      border-radius: 4px;
      padding: 1rem;
      margin-top: 1rem;

      p {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: #666;
      }

      ul {
        margin: 0;
        padding-left: 1.5rem;
        font-size: 0.85rem;
        color: #666;
      }
    }
  `,
})
export class BugReportDialogComponent {
  private dialogRef = inject(MatDialogRef<BugReportDialogComponent>);
  data = inject<BugReportDialogData>(MAT_DIALOG_DATA);

  reportForm = new FormGroup({
    issueType: new FormControl<string>('incorrect_response', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
  });

  cancel() {
    this.dialogRef.close();
  }

  submit() {
    if (this.reportForm.valid) {
      this.dialogRef.close(this.reportForm.value);
    }
  }
}
