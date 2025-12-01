import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ChatMessage, Mode } from '../models/chat.types';
import { OracleInput, OracleService } from './oracle.service';

@Injectable({
  providedIn: 'root',
})
export class ChatStateService {
  private oracleService = inject(OracleService);
  private platformId = inject(PLATFORM_ID);

  // State
  readonly selectedMode = signal<Mode>(this.getInitialMode());
  readonly selectedVersion = signal<string>(this.getInitialVersion());
  readonly inputText = signal<string>('');
  readonly selectedImage = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly isLearnMode = signal<boolean>(false);
  
  // Settings
  readonly fontSize = signal<number>(this.getInitialFontSize());
  readonly theme = signal<'light' | 'dark' | 'system'>(this.getInitialTheme());

  // Computed Config
  readonly modeConfig = computed(() => {
    const mode = this.selectedMode();
    switch (mode) {
      case 'question':
        return {
          title: 'Ask a Question',
          description: 'Get instant answers from Angular documentation',
          label: 'Your question',
          placeholder: 'e.g., How do I create a standalone component?',
          buttonText: 'Ask Question',
          icon: 'search',
          ariaLabel: 'Enter your Angular question',
          submitLabel: 'Submit question',
          isCode: false,
          rows: 2,
          minRows: 2,
          maxRows: 25,
        };
      case 'error':
        return {
          title: 'Paste Error',
          description: 'Get help understanding and fixing Angular errors',
          label: 'Error message or stack trace',
          placeholder: 'Paste your error message or stack trace here...',
          buttonText: 'Analyze Error',
          icon: 'bug_report',
          ariaLabel: 'Paste error message or stack trace',
          submitLabel: 'Analyze error',
          isCode: true,
          rows: 2,
          minRows: 2,
          maxRows: 25,
        };
      case 'review':
        return {
          title: 'Code Review',
          description: 'Get feedback on your Angular code with best practices',
          label: 'Your Angular code',
          placeholder:
            'Paste your Angular component, service, or module code here...',
          buttonText: 'Review Code',
          icon: 'rate_review',
          ariaLabel: 'Paste your Angular code for review',
          submitLabel: 'Submit code for review',
          isCode: true,
          rows: 2,
          minRows: 2,
          maxRows: 25,
        };
    }
  });

  constructor() {
    // Persistence Effects
    effect(() => {
      const version = this.selectedVersion();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('ng-lens-version', version);
      }
    });

    effect(() => {
      const mode = this.selectedMode();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('ng-lens-mode', mode);
      }
    });

    effect(() => {
      const size = this.fontSize();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('ng-lens-font-size', size.toString());
        document.documentElement.style.setProperty('--app-font-size', `${size}px`);
      }
    });

    effect(() => {
      const theme = this.theme();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('ng-lens-theme', theme);
        if (theme === 'system') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', theme);
        }
      }
    });
  }

  // Actions
  setMode(mode: Mode) {
    this.selectedMode.set(mode);
    this.messages.set([]);
    this.inputText.set('');
    this.selectedImage.set(null);
  }

  toggleLearnMode() {
    this.isLearnMode.update((v) => !v);
  }

  setFontSize(size: number) {
    this.fontSize.set(Math.max(12, Math.min(24, size)));
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    this.theme.set(theme);
  }

  setVersion(version: string) {
    this.selectedVersion.set(version);
  }

  setInputText(text: string) {
    this.inputText.set(text);
  }

  setImage(image: string | null) {
    this.selectedImage.set(image);
  }

  clearInput() {
    this.inputText.set('');
    this.selectedImage.set(null);
  }

  sendMessage() {
    const input = this.inputText().trim();
    const image = this.selectedImage();

    if (!input && !image) return;

    const history = this.messages();
    const learnMode = this.isLearnMode();

    // Add user message and placeholder model message
    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content: input, image: image || undefined },
      { role: 'model', content: '' },
    ]);

    this.isLoading.set(true);
    this.inputText.set('');
    this.selectedImage.set(null);

    // Modify query if learn mode is active
    const effectiveQuery = learnMode
      ? `${input}\n\nPlease provide a comprehensive learning guide and tutorial for this topic. Explain the concepts, provide examples, and guide me through it step-by-step.`
      : input;

    const payload: OracleInput = {
      query: effectiveQuery,
      angularVersion: this.selectedVersion(),
      mode: this.selectedMode(),
      history: history,
    };

    if (image) {
      payload.image = image;
    }

    this.oracleService
      .generate(payload)
      .subscribe({
        next: (result) => {
          this.messages.update((msgs) => {
            const newMsgs = [...msgs];
            const lastIdx = newMsgs.length - 1;
            newMsgs[lastIdx] = {
              ...newMsgs[lastIdx],
              content: result.response.blocks,
            };
            return newMsgs;
          });
        },
        error: (error) => {
          console.error('Error calling Oracle:', error);
          this.messages.update((msgs) => {
            const newMsgs = [...msgs];
            const lastIdx = newMsgs.length - 1;
            newMsgs[lastIdx] = {
              ...newMsgs[lastIdx],
              content: 'Sorry, something went wrong. Please try again.',
            };
            return newMsgs;
          });
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  // Helpers
  private getInitialVersion(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('ng-lens-version') || '21';
    }
    return '21';
  }

  private getInitialMode(): Mode {
    if (isPlatformBrowser(this.platformId)) {
      const savedMode = localStorage.getItem('ng-lens-mode');
      if (savedMode && ['question', 'error', 'review'].includes(savedMode)) {
        return savedMode as Mode;
      }
    }
    return 'question';
  }

  private getInitialFontSize(): number {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('ng-lens-font-size');
      return saved ? parseInt(saved, 10) : 16;
    }
    return 16;
  }

  private getInitialTheme(): 'light' | 'dark' | 'system' {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('ng-lens-theme');
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved as 'light' | 'dark' | 'system';
      }
    }
    return 'system';
  }
}
