import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MarkdownComponent } from 'ngx-markdown';
import { ChatBlock, ChatMessage, CodeBlock } from '../models/chat.types';

interface Interaction {
  question: ChatMessage;
  answer?: ChatMessage;
}

@Component({
  selector: 'app-response-display',
  imports: [
    MatCardModule,
    MatProgressBarModule,
    MarkdownComponent,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      state(
        'expanded',
        style({ height: '*', opacity: 1, overflow: 'hidden', display: 'block' })
      ),
      state(
        'collapsed',
        style({
          height: '0px',
          opacity: 0,
          overflow: 'hidden',
          display: 'none',
        })
      ),
      transition(
        'expanded <=> collapsed',
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
  template: `
    <div class="notebook-stream">
      @for (group of interactions(); track $index) {
      <div class="cell-group">
        <!-- Input Cell (User) -->
        <div class="cell input-cell">
          <div class="cell-gutter">
            <span class="execution-count">[{{ $index + 1 }}]</span>
            <button
              mat-icon-button
              class="toggle-button"
              (click)="toggleSection($index)"
              [attr.aria-label]="
                isExpanded($index) ? 'Collapse section' : 'Expand section'
              "
            >
              <mat-icon [class.rotated]="!isExpanded($index)"
                >expand_more</mat-icon
              >
            </button>
          </div>
          <div class="cell-content">
            <div class="input-source">
              @if (group.question.image) {
              <div class="image-attachment">
                <img [src]="group.question.image" alt="User uploaded image" />
              </div>
              }
              <div class="source-code">{{ group.question.content }}</div>
            </div>
          </div>
        </div>

        <!-- Output Cell (Model) -->
        <div
          class="cell output-cell"
          [@expandCollapse]="isExpanded($index) ? 'expanded' : 'collapsed'"
        >
          <div class="cell-gutter">
            <!-- Empty gutter for alignment -->
          </div>
          <div class="cell-content">
            @if (group.answer) {
            <div class="output-result" aria-live="polite">
              @if (isString(group.answer.content)) {
              @if(asString(group.answer.content)) {
              <markdown
                [data]="asString(group.answer.content)"
                clipboard
              ></markdown>
              } @else if (isLoading() && $last) {
              <div class="thinking-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <span>Thinking...</span>
              </div>
              } } @else {
              <div class="blocks-container">
                @for (block of asBlocks(group.answer.content); track $index) {
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
                    <span class="language-badge">{{ block.language }}</span>
                  </div>
                  }
                  <markdown
                    [data]="getCodeBlock(block)"
                    clipboard
                  ></markdown>
                </div>
                } }
              </div>
              }
            </div>
            } @else if (isLoading() && $last) {
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
              <span>Thinking...</span>
            </div>
            }
          </div>
        </div>
      </div>
      } @if (interactions().length === 0) {
      <div class="empty-notebook">
        <div class="notebook-intro">
          <h1>ng-lens Notebook</h1>
          <p>Interactive Angular Learning Environment</p>
        </div>

        <div class="quick-starts">
          <button mat-stroked-button class="start-chip">
            <mat-icon>code</mat-icon>
            Explain Code
          </button>
          <button mat-stroked-button class="start-chip">
            <mat-icon>bug_report</mat-icon>
            Debug Issue
          </button>
          <button mat-stroked-button class="start-chip">
            <mat-icon>image</mat-icon>
            Analyze UI
          </button>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .notebook-stream {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding-bottom: 2rem;
        width: 100%;
      }

      .cell-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        position: relative;

        /* Connecting line for context */
        &::before {
          content: '';
          position: absolute;
          left: 29px; /* Center of gutter */
          top: 2rem;
          bottom: 2rem;
          width: 2px;
          background: var(--mat-sys-outline-variant);
          opacity: 0.3;
          z-index: 0;
        }
      }

      .cell {
        display: flex;
        width: 100%;
        position: relative;
        z-index: 1;
      }

      .cell-gutter {
        width: 60px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        padding-right: 1rem;
        padding-top: 1rem;
        user-select: none;
      }

      .execution-count {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        color: var(--mat-sys-secondary);
        font-weight: 500;
        background: var(--mat-sys-background); /* Mask line */
        padding: 2px 0;
        margin-bottom: 4px;
      }

      .toggle-button {
        width: 24px;
        height: 24px;
        line-height: 24px;
        padding: 0;
        opacity: 0.5;
        transition: opacity 0.2s;

        &:hover {
          opacity: 1;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: var(--mat-sys-on-surface-variant);
          transition: transform 0.3s ease;

          &.rotated {
            transform: rotate(-90deg);
          }
        }
      }

      .cell-content {
        flex: 1;
        min-width: 0;
      }

      .input-cell {
        .cell-content {
          background-color: var(--mat-sys-surface-container-low);
          border-radius: 16px;
          padding: 1rem 1.5rem;
          transition: background-color 0.2s;

          &:hover {
            background-color: var(--mat-sys-surface-container);
          }
        }

        .input-source {
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
          font-size: 14px;
          color: var(--mat-sys-on-surface);
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .image-attachment {
          margin-bottom: 1rem;
          img {
            max-height: 250px;
            border-radius: 8px;
            border: 1px solid var(--mat-sys-outline-variant);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
        }
      }

      .output-cell {
        margin-top: 0.5rem;

        .cell-content {
          padding: 0.5rem 1.5rem;
        }

        .output-result {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
          font-size: 16px;
          line-height: 1.6;
          color: var(--mat-sys-on-surface);

          .blocks-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .text-block {
            /* Standard markdown styles */
          }

          .code-block-wrapper {
            border: 1px solid var(--mat-sys-outline-variant);
            border-radius: 8px;
            overflow: hidden;
            background: var(--mat-sys-surface-container-lowest);
            margin: 1rem 0;

            .code-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0.5rem 1rem;
              background: var(--mat-sys-surface-container);
              border-bottom: 1px solid var(--mat-sys-outline-variant);

              .filename {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
                font-size: 13px;
                color: var(--mat-sys-on-surface);
                font-weight: 600;

                mat-icon {
                  font-size: 16px;
                  width: 16px;
                  height: 16px;
                }
              }

              .language-badge {
                font-size: 12px;
                text-transform: uppercase;
                color: var(--mat-sys-secondary);
                font-weight: 600;
              }
            }

            /* Override ngx-markdown pre styles to fit our container */
            ::ng-deep pre {
              margin: 0 !important;
              border-radius: 0 !important;
              background: transparent !important;
              padding: 16px !important;
              font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace !important;
              font-size: 14px !important;
              line-height: 1.5 !important;
            }
          }
        }
      }

      .thinking-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 1rem 0;
        color: var(--mat-sys-secondary);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.9rem;

        .dot {
          width: 8px;
          height: 8px;
          background-color: var(--mat-sys-secondary);
          border-radius: 50%;
          animation: pulse 1.4s infinite ease-in-out both;

          &:nth-child(1) {
            animation-delay: -0.32s;
          }
          &:nth-child(2) {
            animation-delay: -0.16s;
          }
        }
      }

      @keyframes pulse {
        0%,
        80%,
        100% {
          transform: scale(0);
        }
        40% {
          transform: scale(1);
        }
      }

      .empty-notebook {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 6rem 2rem;
        text-align: center;
        color: var(--mat-sys-on-surface-variant);

        .notebook-intro {
          margin-bottom: 3rem;
          h1 {
            font-size: 3rem;
            font-weight: 400;
            margin-bottom: 1rem;
            color: var(--mat-sys-on-surface);
            letter-spacing: -0.5px;
          }
          p {
            font-size: 1.25rem;
            max-width: 600px;
            line-height: 1.5;
          }
        }

        .quick-starts {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;

          .start-chip {
            border-radius: 100px;
            padding: 0 1.5rem;
            height: 48px;
            border-color: var(--mat-sys-outline);
            color: var(--mat-sys-primary);
            font-weight: 500;

            mat-icon {
              margin-right: 8px;
            }

            &:hover {
              background-color: var(--mat-sys-secondary-container);
              border-color: transparent;
              color: var(--mat-sys-on-secondary-container);
            }
          }
        }
      }
    `,
  ],
})
export class ResponseDisplayComponent {
  messages = input.required<ChatMessage[]>();
  isLoading = input.required<boolean>();

  // State for expanded sections
  expandedStates = signal<boolean[]>([]);
  private prevLength = 0;

  interactions = computed(() => {
    const msgs = this.messages();
    const groups: Interaction[] = [];
    let currentGroup: Interaction | null = null;

    for (const msg of msgs) {
      if (msg.role === 'user') {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = { question: msg };
      } else if (msg.role === 'model') {
        if (currentGroup) {
          currentGroup.answer = msg;
        } else {
          // Handle orphaned model message if necessary
        }
      }
    }
    if (currentGroup) {
      groups.push(currentGroup);
    }
    return groups;
  });

  constructor() {
    effect(
      () => {
        const currentInteractions = this.interactions();
        const len = currentInteractions.length;

        if (len > this.prevLength) {
          // New interaction added: Collapse all previous, expand new one
          this.expandedStates.update(() => {
            const newStates = new Array(len).fill(false);
            // Keep previous states if needed? No, requirement is "collapse all previous"
            // But we need to make sure we don't lose manual toggles if length didn't change.
            // Here length changed, so we reset.
            newStates[len - 1] = true;
            return newStates;
          });
          this.prevLength = len;

          // Scroll to bottom
          setTimeout(() => {
            const cells = document.querySelectorAll('.cell-group');
            const lastCell = cells[cells.length - 1];
            if (lastCell) {
              lastCell.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        } else if (len < this.prevLength) {
          // Reset if cleared
          this.expandedStates.set([]);
          this.prevLength = 0;
        }
      },
      { allowSignalWrites: true }
    );
  }

  isExpanded(index: number): boolean {
    return this.expandedStates()[index] ?? false;
  }

  toggleSection(index: number) {
    this.expandedStates.update((states) => {
      const newStates = [...states];
      // Ensure array is large enough (should be, but safety first)
      while (newStates.length <= index) newStates.push(false);
      newStates[index] = !newStates[index];
      return newStates;
    });
  }

  isString(content: string | ChatBlock[]): boolean {
    return typeof content === 'string';
  }

  asBlocks(content: string | ChatBlock[]): ChatBlock[] {
    return content as ChatBlock[];
  }

  asString(content: string | ChatBlock[]): string {
    return content as string;
  }

  getCodeBlock(block: CodeBlock): string {
    return '```' + block.language + '\n' + block.content + '\n```';
  }
}
