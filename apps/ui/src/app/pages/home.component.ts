import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FooterComponent } from '../components/footer.component';
import { HeaderComponent } from '../components/header.component';
import { ModeInputComponent } from '../components/mode-input.component';
import { ResponseDisplayComponent } from '../components/response-display.component';
import { ANGULAR_VERSIONS, AVAILABLE_MODES } from '../config/chat.config';
import { ChatStateService } from '../services/chat-state.service';

@Component({
  selector: 'app-home',
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
    <div class="page-layout">
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
        <div class="scrollable-area">
          <div class="content-wrapper">
            <app-response-display
              [isLoading]="chatState.isLoading()"
              [messages]="chatState.messages()"
              [selectedVersion]="chatState.selectedVersion()"
              [selectedMode]="chatState.selectedMode()"
              [isLearnMode]="chatState.isLearnMode()"
              (cancelRequest)="chatState.cancelRequest()"
              (retryRequest)="chatState.retryLastRequest()"
              (promptSelected)="chatState.setInputText($event)"
            />
          </div>
        </div>

        <footer class="page-footer">
          <div class="input-container">
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
                [selectedVersion]="chatState.selectedVersion()"
                [isCompact]="chatState.messages().length > 0"
                [selectedImage]="chatState.selectedImage()"
                [isLearnMode]="chatState.isLearnMode()"
                (modeChange)="chatState.setMode($event)"
                (inputChange)="chatState.setInputText($event)"
                (imageSelected)="chatState.setImage($event)"
                (submitAction)="sendMessage()"
                (clear)="chatState.clearInput()"
                (learnModeChange)="chatState.toggleLearnMode()"
                (newSession)="chatState.startNewSession()"
                (navigateHistory)="chatState.navigateHistory($event)"
              />
            </div>
          </div>
          <app-footer />
        </footer>
      </main>
    </div>
  `,
  styles: `
    /* Layout Container */
    .page-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    /* Drag and Drop Overlay */
    .drag-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .drag-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: white;

      mat-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 500;
      }
    }

    /* Main Content Area */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }

    /* Scrollable Content Area */
    .scrollable-area {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .content-wrapper {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      width: 100%;

      @media (max-width: 768px) {
        padding: 1rem;
      }
    }

    /* Page Footer (Input + Footer) */
    .page-footer {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }

    .input-container {
      background: var(--mat-sys-surface);
      border-top: 1px solid var(--mat-sys-outline-variant);
      padding: 1rem 0;
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);

      .content-wrapper {
        padding: 0 2rem;

        @media (max-width: 768px) {
          padding: 0 1rem;
        }
      }
    }

    app-footer {
      flex-shrink: 0;
    }
  `,
})
export class HomeComponent {
  protected readonly chatState = inject(ChatStateService);
  protected readonly angularVersions = ANGULAR_VERSIONS;
  protected readonly availableModes = AVAILABLE_MODES;
  protected readonly isDragging = signal(false);

  @HostListener('window:dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    const items = event.dataTransfer?.items;
    if (items && items.length > 0 && items[0].kind === 'file') {
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    if (event.target === event.currentTarget) {
      this.isDragging.set(false);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          this.chatState.setImage(base64);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  sendMessage() {
    this.chatState.sendMessage();
  }
}
