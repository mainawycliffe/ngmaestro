import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfidenceMetadata } from '../models/chat.types';

@Component({
  selector: 'app-confidence-indicator',
  standalone: true,
  imports: [MatExpansionModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="confidence">
      <mat-expansion-panel class="card" hideToggle>
        <mat-expansion-panel-header>
          <mat-panel-title>
            <div class="header">
              <mat-icon [class]="iconClass()" [matTooltip]="confidenceLevel()">
                {{ icon() }}
              </mat-icon>
              <div class="title">
                <span>Confidence</span>
                <span class="subtitle">
                  Overall {{ overall() }}/10 · {{ confidenceLevel() }}
                </span>
              </div>
            </div>
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div class="grid">
          <div class="metric">
            <div class="metric-header">
              <span>Overall</span>
              <span class="score" [class]="scoreClass(overall())"
                >{{ overall() }}/10</span
              >
            </div>
            <div class="bar">
              <div
                class="fill"
                [class]="scoreClass(overall())"
                [style.width.%]="(overall() / 10) * 100"
              ></div>
            </div>
            <p class="hint">Model's confidence in the full response.</p>
          </div>

          @if (confidence().docs_confidence !== undefined) {
            <div class="metric">
              <div class="metric-header">
                <span>Docs Retrieval</span>
                <span
                  class="score"
                  [class]="scoreClass(confidence().docs_confidence!)"
                >
                  {{ confidence().docs_confidence }}/10
                </span>
              </div>
              <div class="bar">
                <div
                  class="fill"
                  [class]="scoreClass(confidence().docs_confidence!)"
                  [style.width.%]="(confidence().docs_confidence! / 10) * 100"
                ></div>
              </div>
              <p class="hint">How well supporting docs were found.</p>
            </div>
          }

          @if (confidence().answer_confidence !== undefined) {
            <div class="metric">
              <div class="metric-header">
                <span>Answer Quality</span>
                <span
                  class="score"
                  [class]="scoreClass(confidence().answer_confidence!)"
                >
                  {{ confidence().answer_confidence }}/10
                </span>
              </div>
              <div class="bar">
                <div
                  class="fill"
                  [class]="scoreClass(confidence().answer_confidence!)"
                  [style.width.%]="(confidence().answer_confidence! / 10) * 100"
                ></div>
              </div>
              <p class="hint">Correctness and completeness of the reply.</p>
            </div>
          }
        </div>

        @if (confidence().concerns?.length) {
          <div class="concerns">
            <div class="concerns-title">
              <mat-icon>warning</mat-icon>
              Remaining uncertainties
            </div>
            <ul>
              @for (item of confidence().concerns; track $index) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        }
      </mat-expansion-panel>
    </div>
  `,
  styles: `
    .confidence {
      margin-top: 1rem;
    }

    .card {
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid var(--md-sys-color-outline-variant);
      box-shadow: none;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    mat-icon {
      width: 1.5rem;
      height: 1.5rem;
      font-size: 1.5rem;
    }

    mat-icon.high {
      color: var(--md-sys-color-tertiary);
    }

    mat-icon.medium {
      color: var(--md-sys-color-primary);
    }

    mat-icon.low {
      color: var(--md-sys-color-error);
    }

    .title {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      font-weight: 600;
    }

    .subtitle {
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 400;
      font-size: 0.85rem;
    }

    .grid {
      margin-top: 1rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.75rem;
    }

    .metric {
      background: var(--md-sys-color-surface-container);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 0.75rem;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }

    .score {
      padding: 0.2rem 0.55rem;
      border-radius: 0.4rem;
      font-weight: 700;
      font-size: 0.85rem;
      border: 1px solid transparent;
    }

    .score.high {
      color: var(--md-sys-color-tertiary);
      border-color: color-mix(
        in srgb,
        var(--md-sys-color-tertiary) 40%,
        transparent
      );
      background: color-mix(
        in srgb,
        var(--md-sys-color-tertiary) 12%,
        transparent
      );
    }

    .score.medium {
      color: var(--md-sys-color-primary);
      border-color: color-mix(
        in srgb,
        var(--md-sys-color-primary) 40%,
        transparent
      );
      background: color-mix(
        in srgb,
        var(--md-sys-color-primary) 12%,
        transparent
      );
    }

    .score.low {
      color: var(--md-sys-color-error);
      border-color: color-mix(
        in srgb,
        var(--md-sys-color-error) 40%,
        transparent
      );
      background: color-mix(
        in srgb,
        var(--md-sys-color-error) 12%,
        transparent
      );
    }

    .bar {
      height: 0.5rem;
      background: var(--md-sys-color-surface-container-highest);
      border-radius: 0.4rem;
      overflow: hidden;
    }

    .fill {
      height: 100%;
      transition: width 200ms ease;
    }

    .fill.high {
      background: var(--md-sys-color-tertiary);
    }

    .fill.medium {
      background: var(--md-sys-color-primary);
    }

    .fill.low {
      background: var(--md-sys-color-error);
    }

    .hint {
      margin: 0;
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    .concerns {
      margin-top: 1rem;
      padding: 0.85rem;
      border: 1px solid var(--md-sys-color-error);
      border-radius: 0.6rem;
      background: color-mix(
        in srgb,
        var(--md-sys-color-error) 10%,
        transparent
      );
    }

    .concerns-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 700;
      color: var(--md-sys-color-error);
      margin-bottom: 0.35rem;
    }

    .concerns ul {
      margin: 0;
      padding-left: 1.2rem;
      color: var(--md-sys-color-on-surface);
      font-size: 0.85rem;
      display: grid;
      gap: 0.25rem;
    }
  `,
})
export class ConfidenceIndicatorComponent {
  confidence = input.required<ConfidenceMetadata>();

  overall = computed(() => this.confidence().overall_confidence);

  confidenceLevel = computed(() => {
    const score = this.overall();
    if (score >= 9) return 'High';
    if (score >= 7) return 'Medium';
    return 'Low';
  });

  icon = computed(() => {
    const score = this.overall();
    if (score >= 9) return 'check_circle';
    if (score >= 7) return 'info';
    return 'warning';
  });

  iconClass = computed(() => this.scoreClass(this.overall()));

  scoreClass(score: number): 'high' | 'medium' | 'low' {
    if (score >= 9) return 'high';
    if (score >= 7) return 'medium';
    return 'low';
  }
}
