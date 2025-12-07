import { TitleCasePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import {
  SavedResult,
  SavedResultsService,
} from '../services/saved-results.service';

@Component({
  selector: 'app-shared-result',
  imports: [
    TitleCasePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MarkdownComponent,
  ],
  template: `
    <div class="shared-result-container">
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading shared result...</p>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-header>
            <mat-icon color="warn">error</mat-icon>
            <mat-card-title>Result Not Found</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>{{ error() }}</p>
            <button mat-flat-button color="primary" (click)="goHome()">
              <mat-icon>home</mat-icon>
              Go to Home
            </button>
          </mat-card-content>
        </mat-card>
      } @else if (result()) {
        <mat-card class="result-card">
          <mat-card-header>
            <mat-card-title>Shared Result</mat-card-title>
            <mat-card-subtitle>
              {{ result()!.mode | titlecase }} • Angular
              {{ result()!.angularVersion }}
              @if (result()!.learningMode) {
                • Learning Mode
              }
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="query-section">
              <h3>Question</h3>
              <p class="query-text">{{ result()!.query }}</p>
            </div>

            <div class="response-section">
              <h3>Response</h3>
              <div class="blocks-container">
                @for (block of result()!.response.blocks; track $index) {
                  @if (block.type === 'text') {
                    <div class="text-block">
                      <markdown [data]="block.content"></markdown>
                    </div>
                  } @else if (block.type === 'code') {
                    <div class="code-block-wrapper">
                      @if (block.filename) {
                        <div class="code-header">
                          <span class="filename">
                            <mat-icon>description</mat-icon>
                            {{ block.filename }}
                          </span>
                          <span class="language-badge">{{
                            block.language
                          }}</span>
                        </div>
                      }
                      <markdown
                        [data]="getCodeBlock(block)"
                        clipboard
                      ></markdown>
                    </div>
                  }
                }
              </div>
            </div>

            <div class="metadata-section">
              <div class="meta-item">
                <mat-icon>visibility</mat-icon>
                <span>{{ result()!.viewCount }} views</span>
              </div>
              <div class="meta-item">
                <mat-icon>schedule</mat-icon>
                <span>{{ formatDate(result()!.createdAt) }}</span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-flat-button color="primary" (click)="goHome()">
              <mat-icon>home</mat-icon>
              Try NgMaestro
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .shared-result-container {
      max-width: 1800px;
      margin: 2rem auto;
      padding: 0 2rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      gap: 1rem;

      p {
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .error-card {
      mat-card-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;

        mat-icon {
          font-size: 2rem;
          width: 2rem;
          height: 2rem;
        }
      }

      mat-card-content {
        p {
          margin-bottom: 1.5rem;
        }
      }
    }

    .result-card {
      mat-card-subtitle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
      }
    }

    .query-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      h3 {
        margin: 0 0 1rem 0;
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .query-text {
        font-size: 1.1rem;
        line-height: 1.6;
        margin: 0;
      }
    }

    .response-section {
      margin-bottom: 2rem;

      h3 {
        margin: 0 0 1rem 0;
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .blocks-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .text-block {
      line-height: 1.8;

      ::ng-deep {
        p {
          margin: 0 0 1rem 0;
        }

        ul,
        ol {
          margin: 0 0 1rem 0;
          padding-left: 1.5rem;
        }

        code {
          background: var(--mat-sys-surface-container-high);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.9em;
        }
      }
    }

    .code-block-wrapper {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      overflow: hidden;

      .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: var(--mat-sys-surface-container-high);
        border-bottom: 1px solid var(--mat-sys-outline-variant);

        .filename {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: monospace;
          font-size: 0.9rem;

          mat-icon {
            font-size: 1.2rem;
            width: 1.2rem;
            height: 1.2rem;
          }
        }

        .language-badge {
          background: var(--mat-sys-primary-container);
          color: var(--mat-sys-on-primary-container);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          text-transform: uppercase;
          font-weight: 500;
        }
      }

      ::ng-deep pre {
        margin: 0;
        border-radius: 0;
      }
    }

    .metadata-section {
      display: flex;
      gap: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--mat-sys-outline-variant);

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.9rem;

        mat-icon {
          font-size: 1.2rem;
          width: 1.2rem;
          height: 1.2rem;
        }
      }
    }

    mat-card-actions {
      padding: 1rem 1.5rem;
    }
  `,
})
export class SharedResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private savedResultsService = inject(SavedResultsService);

  loading = signal(true);
  error = signal<string | null>(null);
  result = signal<SavedResult | null>(null);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');

    console.log('SharedResultComponent - slug:', slug);

    if (!slug) {
      this.error.set('No result identifier provided');
      this.loading.set(false);
      return;
    }

    this.savedResultsService.getResult(slug).subscribe({
      next: (result) => {
        console.log('SharedResultComponent - result:', result);
        this.result.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load shared result:', err);
        this.error.set(
          'This shared result could not be found. It may have been removed or the link is incorrect.',
        );
        this.loading.set(false);
      },
    });
  }

  getCodeBlock(block: {
    type: 'code';
    language: string;
    content: string;
    filename?: string;
  }): string {
    return `\`\`\`${block.language}\n${block.content}\n\`\`\``;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
