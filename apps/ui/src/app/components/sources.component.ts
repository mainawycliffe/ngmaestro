import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { DocSource } from '../models/chat.types';

@Component({
  selector: 'app-sources',
  imports: [MatChipListbox, MatChipOption, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sources().length > 0) {
      <div class="sources-container">
        <div class="sources-header">
          <mat-icon class="sources-icon">source</mat-icon>
          <h3>Documentation Sources</h3>
        </div>
        <mat-chip-listbox class="sources-list" [multiple]="false">
          @for (source of sources(); track source.url) {
            <mat-chip-option
              [value]="source.url"
              class="source-chip"
              [class]="'source-' + source.source"
            >
              <a
                [href]="source.url"
                target="_blank"
                rel="noopener noreferrer"
                class="source-link"
                (click)="$event.stopPropagation()"
              >
                <span class="source-badge">{{
                  getSourceLabel(source.source)
                }}</span>
                <span class="source-title">{{ source.title }}</span>
                <mat-icon class="external-icon">open_in_new</mat-icon>
              </a>
            </mat-chip-option>
          }
        </mat-chip-listbox>
      </div>
    }
  `,
  styles: `
    .sources-container {
      margin: 1.5rem 0;
      padding: 1rem;
      background: rgba(63, 81, 181, 0.05);
      border-radius: 8px;
      border-left: 4px solid #3f51b5;
    }

    .sources-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .sources-icon {
      color: #3f51b5;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .sources-header h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #3f51b5;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sources-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .source-chip {
      width: 100%;
      height: auto;
      min-height: 48px;
      padding: 0;
      border-radius: 6px;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.12);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(63, 81, 181, 0.08);
        border-color: #3f51b5;
        transform: translateX(4px);
      }

      &.source-angular {
        border-left: 3px solid #dd0031;
      }

      &.source-material {
        border-left: 3px solid #3f51b5;
      }

      &.source-ngrx {
        border-left: 3px solid #412846;
      }

      &.source-analogjs {
        border-left: 3px solid #ff4785;
      }
    }

    .source-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      width: 100%;
      text-decoration: none;
      color: inherit;
    }

    .source-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .source-angular .source-badge {
      background: rgba(221, 0, 49, 0.1);
      color: #dd0031;
    }

    .source-material .source-badge {
      background: rgba(63, 81, 181, 0.1);
      color: #3f51b5;
    }

    .source-ngrx .source-badge {
      background: rgba(65, 40, 70, 0.1);
      color: #412846;
    }

    .source-analogjs .source-badge {
      background: rgba(255, 71, 133, 0.1);
      color: #ff4785;
    }

    .source-title {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .external-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.54);
      flex-shrink: 0;
    }

    @media (prefers-color-scheme: dark) {
      .sources-container {
        background: rgba(63, 81, 181, 0.15);
        border-left-color: #5c6bc0;
      }

      .sources-header h3,
      .sources-icon {
        color: #7986cb;
      }

      .source-chip {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.12);

        &:hover {
          background: rgba(63, 81, 181, 0.2);
          border-color: #7986cb;
        }
      }

      .source-title {
        color: rgba(255, 255, 255, 0.87);
      }

      .external-icon {
        color: rgba(255, 255, 255, 0.7);
      }
    }
  `,
})
export class SourcesComponent {
  sources = input.required<DocSource[]>();

  getSourceLabel(source: string): string {
    const labels: Record<string, string> = {
      angular: 'Angular',
      material: 'Material',
      ngrx: 'NgRx',
      analogjs: 'Analog',
    };
    return labels[source] || source;
  }
}
