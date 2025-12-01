import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FooterComponent } from './components/footer.component';
import { HeaderComponent } from './components/header.component';
import { ModeInputComponent } from './components/mode-input.component';
import { ResponseDisplayComponent } from './components/response-display.component';
import { ANGULAR_VERSIONS, AVAILABLE_MODES } from './config/chat.config';
import { ChatStateService } from './services/chat-state.service';

@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    FooterComponent,
    ModeInputComponent,
    ResponseDisplayComponent,
    MatIconModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-container" (dragover)="onDragOver($event)">
      @if (isDragging()) {
      <div
        class="drag-overlay"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <div class="drag-content">
          <mat-icon>cloud_upload</mat-icon>
          <h2>Drop image to analyze</h2>
        </div>
      </div>
      }

      <app-header
        [selectedVersion]="chatState.selectedVersion()"
        [versions]="angularVersions"
        [fontSize]="chatState.fontSize()"
        [theme]="chatState.theme()"
        (versionChange)="chatState.setVersion($event)"
        (fontSizeChange)="chatState.setFontSize($event)"
        (themeChange)="chatState.setTheme($event)"
      />

      <main class="main-content" role="main">
        <div class="notebook-container">
          <div class="content-wrapper">
            <app-response-display
              [isLoading]="chatState.isLoading()"
              [messages]="chatState.messages()"
            />
          </div>
        </div>

        <div class="input-cell-container">
          <div class="content-wrapper">
            <app-mode-input
              [title]="chatState.modeConfig().title"
              [description]="chatState.modeConfig().description"
              [label]="chatState.modeConfig().label"
              [placeholder]="chatState.modeConfig().placeholder"
              [buttonText]="chatState.modeConfig().buttonText"
              [icon]="chatState.modeConfig().icon"
              [ariaLabel]="chatState.modeConfig().ariaLabel"
              [submitLabel]="chatState.modeConfig().submitLabel"
              [isCode]="chatState.modeConfig().isCode"
              [rows]="chatState.modeConfig().rows"
              [minRows]="chatState.modeConfig().minRows"
              [maxRows]="chatState.modeConfig().maxRows"
              [inputText]="chatState.inputText()"
              [modes]="availableModes"
              [selectedMode]="chatState.selectedMode()"
              [isCompact]="chatState.messages().length > 0"
              [selectedImage]="chatState.selectedImage()"
              [isLearnMode]="chatState.isLearnMode()"
              (modeChange)="chatState.setMode($event)"
              (inputChange)="chatState.setInputText($event)"
              (imageSelected)="chatState.setImage($event)"
              (submitAction)="sendMessage()"
              (clear)="chatState.clearInput()"
              (learnModeChange)="chatState.toggleLearnMode()"
            />
          </div>
        </div>
      </main>

      @if (chatState.messages().length === 0) {
      <app-footer />
      }
    </div>
  `,
  styles: [
    `
      .app-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: var(--mat-sys-background);
        color: var(--mat-sys-on-background);
        overflow: hidden;
      }

      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
        position: relative;
        overflow-y: auto; /* Main scroll container */
        scroll-behavior: smooth;

        /* Notebook-like scrollbar */
        &::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        &::-webkit-scrollbar-track {
          background: transparent;
        }
        &::-webkit-scrollbar-thumb {
          background-color: var(--mat-sys-outline-variant);
          border-radius: 4px;
        }
        &::-webkit-scrollbar-thumb:hover {
          background-color: var(--mat-sys-outline);
        }
      }

      .notebook-container {
        flex: 1;
        /* overflow-y: auto; Removed internal scroll */
        padding: 1rem;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center; /* Center the wrapper */

        @media (min-width: 768px) {
          padding: 2rem 3rem;
        }

        @media (min-width: 1440px) {
          padding: 2rem 5rem;
        }
      }

      .input-cell-container {
        position: sticky;
        bottom: 0;
        flex-shrink: 0;
        width: 100%;
        background: var(--mat-sys-background);
        border-top: 1px solid var(--mat-sys-outline-variant);
        padding: 1rem;
        z-index: 10;
        animation: fadeIn 0.3s ease-out;
        display: flex;
        justify-content: center; /* Center the wrapper */

        @media (min-width: 768px) {
          padding: 1.5rem 3rem;
        }

        @media (min-width: 1440px) {
          padding: 1.5rem 5rem;
        }
      }

      .content-wrapper {
        width: 100%;
        max-width: 1800px; /* Significantly increased width */
      }

      .drag-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--mat-sys-surface);
        opacity: 0.95;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;

        .drag-content {
          text-align: center;
          pointer-events: none;

          mat-icon {
            font-size: 64px;
            width: 64px;
            height: 64px;
            color: var(--mat-sys-primary);
            margin-bottom: 1rem;
          }

          h2 {
            font-size: 1.5rem;
            color: var(--mat-sys-primary);
            margin: 0;
          }
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class App {
  protected readonly chatState = inject(ChatStateService);
  protected readonly angularVersions = ANGULAR_VERSIONS;
  protected readonly availableModes = AVAILABLE_MODES;

  isDragging = signal(false);

  sendMessage() {
    this.chatState.sendMessage();
  }

  @HostListener('window:dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isDragging()) {
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Only hide if we are leaving the overlay (which covers the window)
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.processFile(file);
      }
    }
  }

  private processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.chatState.setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }
}
