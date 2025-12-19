import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SavedResultsService } from '../services/saved-results.service';

@Component({
  selector: 'app-share-result',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="share-actions">
      <button
        mat-icon-button
        (click)="shareResult()"
        [disabled]="isSaving()"
        matTooltip="Share this result"
      >
        <mat-icon>{{ shareIcon() }}</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .share-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
  `,
})
export class ShareResultComponent {
  query = input.required<string>();
  angularVersion = input.required<string>();
  mode = input.required<'question' | 'error' | 'review'>();
  response = input.required<{
    blocks: Array<
      | { type: 'text'; content: string }
      | { type: 'code'; language: string; content: string; filename?: string }
    >;
  }>();

  private savedResultsService = inject(SavedResultsService);
  private snackBar = inject(MatSnackBar);

  isSaving = signal(false);
  shareIcon = signal('share');

  shareResult() {
    this.isSaving.set(true);
    this.shareIcon.set('hourglass_empty');

    this.savedResultsService
      .saveResult(
        this.query(),
        this.angularVersion(),
        this.mode(),
        this.response(),
      )
      .subscribe({
        next: ({ slug }) => {
          this.savedResultsService.copyShareUrl(slug).then((success) => {
            if (success) {
              this.snackBar.open('Share link copied to clipboard!', 'Close', {
                duration: 3000,
              });
              this.shareIcon.set('check');
              setTimeout(() => this.shareIcon.set('share'), 2000);
            } else {
              this.snackBar.open('Failed to copy link. Try again.', 'Close', {
                duration: 3000,
              });
              this.shareIcon.set('share');
            }
            this.isSaving.set(false);
          });
        },
        error: (error) => {
          console.error('Failed to share result:', error);
          this.snackBar.open('Failed to share result. Try again.', 'Close', {
            duration: 3000,
          });
          this.shareIcon.set('share');
          this.isSaving.set(false);
        },
      });
  }
}
