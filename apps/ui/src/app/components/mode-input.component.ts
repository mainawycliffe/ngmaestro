import { TextFieldModule } from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Mode, ModeOption } from '../models/chat.types';

@Component({
  selector: 'app-mode-input',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    TextFieldModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notebook-input-cell">
      <div class="cell-gutter">
        <!-- Empty gutter for alignment -->
      </div>

      <div class="cell-content-wrapper">
        <!-- Toolbar -->
        <div class="cell-toolbar">
          <div class="mode-selector">
            <mat-button-toggle-group
              [value]="selectedMode()"
              (change)="modeChange.emit($event.value)"
              aria-label="Select interaction mode"
              class="mini-toggle-group"
              hideSingleSelectionIndicator="true"
            >
              @for (mode of modes(); track mode.value) {
              <mat-button-toggle [value]="mode.value" [aria-label]="mode.label">
                <mat-icon>{{ mode.icon }}</mat-icon>
              </mat-button-toggle>
              }
            </mat-button-toggle-group>
            <span class="mode-label">{{ title() }}</span>
          </div>

          <div class="toolbar-actions">
            <mat-slide-toggle
              [checked]="isLearnMode()"
              (change)="learnModeChange.emit($event.checked)"
              color="primary"
              class="mini-slide-toggle"
            >
              <span class="toggle-label">Learning Mode</span>
            </mat-slide-toggle>

            <button
              mat-icon-button
              (click)="clear.emit()"
              aria-label="Clear input"
              title="Clear"
            >
              <mat-icon>delete_outline</mat-icon>
            </button>
          </div>
        </div>

        <!-- Input Area -->
        <div class="input-editor" [class.code-mode]="isCode()">
          @if (selectedImage()) {
          <div class="image-preview-container">
            <img
              [src]="selectedImage()"
              alt="Selected image"
              class="image-preview"
            />
            <button
              mat-icon-button
              (click)="removeImage()"
              class="remove-image-btn"
              aria-label="Remove image"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
          }

          <textarea
            matInput
            [value]="inputText()"
            (input)="onInputChange($event)"
            [placeholder]="placeholder()"
            cdkTextareaAutosize
            [cdkAutosizeMinRows]="minRows()"
            [cdkAutosizeMaxRows]="maxRows()"
            [class.code-input]="isCode()"
            [attr.aria-label]="ariaLabel()"
            (keydown.control.enter)="submitAction.emit()"
            (keydown.meta.enter)="submitAction.emit()"
          ></textarea>
        </div>

        <!-- Action Bar -->
        <div class="cell-actions">
          <input
            #fileInput
            type="file"
            accept="image/*"
            style="display: none"
            (change)="onFileSelected($event)"
          />

          <button
            mat-icon-button
            (click)="fileInput.click()"
            aria-label="Upload image"
            class="action-icon-btn"
            title="Upload Image"
          >
            <mat-icon>add_photo_alternate</mat-icon>
          </button>

          <div class="spacer"></div>

          <button
            mat-flat-button
            color="primary"
            [disabled]="!inputText().trim() && !selectedImage()"
            (click)="submitAction.emit()"
            [attr.aria-label]="submitLabel()"
            class="run-btn"
          >
            <mat-icon>play_arrow</mat-icon>
            Run
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .notebook-input-cell {
        display: flex;
        width: 100%;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        position: relative;
        margin-top: 1rem;
      }

      .cell-gutter {
        width: 48px;
        flex-shrink: 0;
        padding-top: 1.5rem;
        padding-right: 0.75rem;
        display: flex;
        justify-content: flex-end;
        color: var(--mat-sys-outline);
      }

      .cell-content-wrapper {
        flex: 1;
        border-radius: 12px;
        background: var(--mat-sys-surface);
        overflow: hidden;
        border: 1px solid var(--mat-sys-outline-variant);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;

        &:focus-within {
          border-color: var(--mat-sys-primary);
          box-shadow: 0 0 0 2px var(--mat-sys-primary-container);
        }
      }

      .cell-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        background: var(--mat-sys-surface-container-low);
      }

      .mode-selector {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .mode-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--mat-sys-on-surface);
          letter-spacing: 0.25px;
        }
      }

      .mini-toggle-group {
        height: 32px;
        align-items: center;
        border-radius: 6px;
        border: 1px solid var(--mat-sys-outline);
        overflow: hidden;

        mat-button-toggle {
          width: 40px;
          height: 32px;
          background: transparent;
          border-left: 1px solid var(--mat-sys-outline);
          color: var(--mat-sys-on-surface-variant);

          ::ng-deep .mat-button-toggle-button {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 0;
          }

          &:first-child {
            border-left: none;
          }

          &:hover {
            background-color: var(--mat-sys-surface-container-high);
            color: var(--mat-sys-on-surface);
          }

          &.mat-button-toggle-checked {
            background-color: var(--mat-sys-surface-container-highest);
            color: var(--mat-sys-primary);
            font-weight: bold;
          }

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .toggle-label {
          font-size: 0.8rem;
          margin-right: 0.5rem;
          color: var(--mat-sys-on-surface-variant);
          font-weight: 500;
        }
      }

      .input-editor {
        padding: 1rem;
        min-height: 100px;
        position: relative;
        background: var(--mat-sys-surface);

        &.code-mode {
          background: var(--mat-sys-surface-container-lowest);
        }

        textarea {
          width: 100%;
          border: none;
          outline: none;
          resize: none;
          background: transparent;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 15px;
          line-height: 1.6;
          color: var(--mat-sys-on-surface);
          caret-color: var(--mat-sys-primary);

          &.code-input {
            font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace;
            font-size: 14px;
          }

          &::placeholder {
            color: var(--mat-sys-on-surface-variant);
            opacity: 0.6;
          }
        }
      }

      .image-preview-container {
        position: relative;
        display: inline-block;
        margin-bottom: 1rem;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--mat-sys-outline-variant);

        .image-preview {
          max-height: 180px;
          display: block;
        }

        .remove-image-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          width: 24px;
          height: 24px;
          line-height: 24px;
          
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }

          &:hover {
            background: rgba(0, 0, 0, 0.8);
          }
        }
      }

      .cell-actions {
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        background: var(--mat-sys-surface);
        border-top: 1px solid var(--mat-sys-outline-variant);
        position: relative;

        .spacer {
          flex: 1;
        }

        .run-btn {
          border-radius: 6px;
          padding: 0 1.5rem;
          height: 36px;
          font-weight: 600;
          letter-spacing: 0.25px;
          font-size: 0.9rem;

          mat-icon {
            margin-right: 6px;
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }

        .action-icon-btn {
          color: var(--mat-sys-on-surface-variant);
          
          &:hover {
            color: var(--mat-sys-primary);
            background: var(--mat-sys-surface-container-high);
          }
        }
      }
    `,
  ],
})
export class ModeInputComponent {
  // Configuration inputs
  title = input.required<string>();
  description = input.required<string>();
  label = input.required<string>();
  placeholder = input.required<string>();
  buttonText = input.required<string>();
  icon = input.required<string>();
  ariaLabel = input.required<string>();
  submitLabel = input.required<string>();

  // Optional inputs with defaults
  isCode = input<boolean>(false);
  rows = input<number>(4);
  minRows = input<number>(4);
  maxRows = input<number>(12);
  isCompact = input<boolean>(false);

  // Input text signal
  inputText = input.required<string>();

  // Mode selection
  modes = input<ModeOption[]>([]);
  selectedMode = input.required<Mode>();
  modeChange = output<Mode>();

  // Learn Mode
  isLearnMode = input<boolean>(true);
  learnModeChange = output<boolean>();

  // Image selection
  selectedImage = input<string | null>(null);
  imageSelected = output<string | null>();

  // Outputs
  inputChange = output<string>();
  submitAction = output<void>();
  clear = output<void>();

  // Internal state
  isExpanded = signal<boolean>(false);

  toggleExpand() {
    this.isExpanded.update((v) => !v);
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.inputChange.emit(target.value);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imageSelected.emit(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.imageSelected.emit(null);
  }
}
