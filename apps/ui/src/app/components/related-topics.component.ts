import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-related-topics',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (topics()?.length) {
      <div class="related-topics">
        <div class="header">
          <mat-icon>explore</mat-icon>
          <span>Related Topics to Explore</span>
        </div>
        <div class="chips">
          @for (topic of topics(); track topic) {
            <mat-chip-set>
              <mat-chip>
                <span class="topic-content">{{ topic }}</span>
              </mat-chip>
            </mat-chip-set>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .related-topics {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 0.5rem;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 0.75rem;
      font-size: 0.95rem;
    }

    mat-icon {
      width: 1.25rem;
      height: 1.25rem;
      font-size: 1.25rem;
      color: var(--md-sys-color-primary);
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    mat-chip-set {
      margin: 0;
    }

    mat-chip {
      font-size: 0.85rem;
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
    }

    .topic-content {
      display: block;
      max-width: 100%;
    }
  `,
})
export class RelatedTopicsComponent {
  topics = input<string[]>();
}
