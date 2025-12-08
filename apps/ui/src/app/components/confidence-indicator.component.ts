import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfidenceMetadata } from '../models/chat.types';

@Component({
  selector: 'app-confidence-indicator',
  imports: [
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="confidence-container">
      <mat-expansion-panel class="confidence-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <div class="confidence-header">
              <mat-icon [class]="confidenceIconClass()">
                {{ confidenceIcon() }}
              </mat-icon>
              <span class="confidence-label">
                Response Confidence: {{ overallConfidence() }}/10
                <span class="confidence-description"
                  >({{ confidenceLevel() }})</span
                >
              </span>
            </div>
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div class="confidence-details">
          <div class="confidence-intro">
            <p>
              This shows the AI's self-assessed confidence at each step of its
              reasoning process. Lower scores indicate areas of uncertainty.
            </p>
          </div>

          <div class="confidence-steps">
            <div class="confidence-step">
              <div class="step-header">
                <span class="step-name">Intent Analysis</span>
                <span
                  class="step-score"
                  [class]="getScoreClass(confidence().step0_intent_analysis)"
                >
                  {{ confidence().step0_intent_analysis }}/10
                </span>
              </div>
              <div class="step-bar">
                <div
                  class="step-fill"
                  [class]="getScoreClass(confidence().step0_intent_analysis)"
                  [style.width.%]="
                    (confidence().step0_intent_analysis / 10) * 100
                  "
                ></div>
              </div>
              <p class="step-description">
                Understanding the core intent and scope of your question
              </p>
            </div>

            <div class="confidence-step">
              <div class="step-header">
                <span class="step-name">Search Planning</span>
                <span
                  class="step-score"
                  [class]="getScoreClass(confidence().step1_search_planning)"
                >
                  {{ confidence().step1_search_planning }}/10
                </span>
              </div>
              <div class="step-bar">
                <div
                  class="step-fill"
                  [class]="getScoreClass(confidence().step1_search_planning)"
                  [style.width.%]="
                    (confidence().step1_search_planning / 10) * 100
                  "
                ></div>
              </div>
              <p class="step-description">
                Planning the strategy to search documentation
              </p>
            </div>

            <div class="confidence-step">
              <div class="step-header">
                <span class="step-name">Documentation Search</span>
                <span
                  class="step-score"
                  [class]="
                    getScoreClass(confidence().step2_documentation_search)
                  "
                >
                  {{ confidence().step2_documentation_search }}/10
                </span>
              </div>
              <div class="step-bar">
                <div
                  class="step-fill"
                  [class]="
                    getScoreClass(confidence().step2_documentation_search)
                  "
                  [style.width.%]="
                    (confidence().step2_documentation_search / 10) * 100
                  "
                ></div>
              </div>
              <p class="step-description">
                Finding complete and relevant documentation
              </p>
            </div>

            <div class="confidence-step">
              <div class="step-header">
                <span class="step-name">Pre-Synthesis Verification</span>
                <span
                  class="step-score"
                  [class]="getScoreClass(confidence().step25_pre_synthesis)"
                >
                  {{ confidence().step25_pre_synthesis }}/10
                </span>
              </div>
              <div class="step-bar">
                <div
                  class="step-fill"
                  [class]="getScoreClass(confidence().step25_pre_synthesis)"
                  [style.width.%]="
                    (confidence().step25_pre_synthesis / 10) * 100
                  "
                ></div>
              </div>
              <p class="step-description">
                Verifying completeness before constructing answer
              </p>
            </div>

            <div class="confidence-step">
              <div class="step-header">
                <span class="step-name">Answer Synthesis</span>
                <span
                  class="step-score"
                  [class]="getScoreClass(confidence().step3_synthesis)"
                >
                  {{ confidence().step3_synthesis }}/10
                </span>
              </div>
              <div class="step-bar">
                <div
                  class="step-fill"
                  [class]="getScoreClass(confidence().step3_synthesis)"
                  [style.width.%]="(confidence().step3_synthesis / 10) * 100"
                ></div>
              </div>
              <p class="step-description">
                Accuracy and completeness of the synthesized answer
              </p>
            </div>

            <div class="confidence-step">
              <div class="step-header">
                <span class="step-name">Final Verification</span>
                <span
                  class="step-score"
                  [class]="getScoreClass(confidence().step4_final_verification)"
                >
                  {{ confidence().step4_final_verification }}/10
                </span>
              </div>
              <div class="step-bar">
                <div
                  class="step-fill"
                  [class]="getScoreClass(confidence().step4_final_verification)"
                  [style.width.%]="
                    (confidence().step4_final_verification / 10) * 100
                  "
                ></div>
              </div>
              <p class="step-description">
                Final accuracy check before responding
              </p>
            </div>
          </div>

          @if (confidence().concerns && confidence().concerns!.length > 0) {
            <div class="confidence-concerns">
              <h4>
                <mat-icon>warning</mat-icon>
                Remaining Uncertainties
              </h4>
              <ul>
                @for (concern of confidence().concerns; track $index) {
                  <li>{{ concern }}</li>
                }
              </ul>
            </div>
          }
        </div>
      </mat-expansion-panel>
    </div>
  `,
  styles: `
    .confidence-container {
      margin-top: 1rem;
    }

    .confidence-panel {
      background: var(--md-sys-color-surface-container-low);
      box-shadow: none;
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    .confidence-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;

      mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;

        &.high {
          color: var(--md-sys-color-tertiary);
        }

        &.medium {
          color: var(--md-sys-color-primary);
        }

        &.low {
          color: var(--md-sys-color-error);
        }
      }
    }

    .confidence-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .confidence-description {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 400;
    }

    .confidence-details {
      padding: 1rem 0;
    }

    .confidence-intro {
      margin-bottom: 1.5rem;
      padding: 0.75rem;
      background: var(--md-sys-color-surface-container);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant);

      p {
        margin: 0;
      }
    }

    .confidence-steps {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .confidence-step {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .step-name {
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
    }

    .step-score {
      font-weight: 600;
      font-size: 0.8125rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;

      &.high {
        background: color-mix(
          in srgb,
          var(--md-sys-color-tertiary) 15%,
          transparent
        );
        color: var(--md-sys-color-tertiary);
      }

      &.medium {
        background: color-mix(
          in srgb,
          var(--md-sys-color-primary) 15%,
          transparent
        );
        color: var(--md-sys-color-primary);
      }

      &.low {
        background: color-mix(
          in srgb,
          var(--md-sys-color-error) 15%,
          transparent
        );
        color: var(--md-sys-color-error);
      }
    }

    .step-bar {
      height: 0.5rem;
      background: var(--md-sys-color-surface-container-highest);
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .step-fill {
      height: 100%;
      transition: width 0.3s ease;

      &.high {
        background: var(--md-sys-color-tertiary);
      }

      &.medium {
        background: var(--md-sys-color-primary);
      }

      &.low {
        background: var(--md-sys-color-error);
      }
    }

    .step-description {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0;
    }

    .confidence-concerns {
      margin-top: 1.5rem;
      padding: 1rem;
      background: color-mix(
        in srgb,
        var(--md-sys-color-error) 10%,
        transparent
      );
      border: 1px solid var(--md-sys-color-error);
      border-radius: 0.5rem;

      h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--md-sys-color-error);

        mat-icon {
          font-size: 1.125rem;
          width: 1.125rem;
          height: 1.125rem;
        }
      }

      ul {
        margin: 0;
        padding-left: 1.5rem;
        font-size: 0.8125rem;
        color: var(--md-sys-color-on-surface);

        li {
          margin-bottom: 0.25rem;
        }
      }
    }
  `,
})
export class ConfidenceIndicatorComponent {
  confidence = input.required<ConfidenceMetadata>();

  overallConfidence = computed(() => this.confidence().overall_confidence);

  confidenceLevel = computed(() => {
    const score = this.overallConfidence();
    if (score >= 9) return 'High';
    if (score >= 7) return 'Medium';
    return 'Low';
  });

  confidenceIcon = computed(() => {
    const score = this.overallConfidence();
    if (score >= 9) return 'check_circle';
    if (score >= 7) return 'info';
    return 'warning';
  });

  confidenceIconClass = computed(() => {
    const score = this.overallConfidence();
    if (score >= 9) return 'high';
    if (score >= 7) return 'medium';
    return 'low';
  });

  getScoreClass(score: number): string {
    if (score >= 9) return 'high';
    if (score >= 7) return 'medium';
    return 'low';
  }
}
