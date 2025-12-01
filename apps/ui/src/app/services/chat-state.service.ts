import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatMessage, Mode } from '../models/chat.types';
import { OracleInput, OracleService } from './oracle.service';

@Injectable({
  providedIn: 'root',
})
export class ChatStateService {
  private oracleService = inject(OracleService);
  private platformId = inject(PLATFORM_ID);
  private currentSubscription: Subscription | null = null;

  // State
  readonly selectedMode = signal<Mode>(this.getInitialMode());
  readonly selectedVersion = signal<string>(this.getInitialVersion());
  readonly inputText = signal<string>('');
  readonly selectedImage = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly isLearnMode = signal<boolean>(this.getInitialLearnMode());

  // Input History
  private inputHistory = signal<string[]>(this.getInitialHistory());
  private historyIndex = signal<number>(-1);

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
        document.documentElement.style.setProperty(
          '--app-font-size',
          `${size}px`
        );
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

    effect(() => {
      const learnMode = this.isLearnMode();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('ng-lens-learn-mode', String(learnMode));
      }
    });

    effect(() => {
      const history = this.inputHistory();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('ng-lens-history', JSON.stringify(history));
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
    this.historyIndex.set(-1);
  }

  startNewSession() {
    this.messages.set([]);
    this.clearInput();
    this.isLoading.set(false);
  }

  navigateHistory(direction: 'prev' | 'next') {
    const history = this.inputHistory();
    if (history.length === 0) return;

    let newIndex = this.historyIndex();

    if (direction === 'prev') {
      if (newIndex === -1) {
        newIndex = history.length - 1;
      } else {
        newIndex = Math.max(0, newIndex - 1);
      }
    } else {
      if (newIndex === -1) return;
      newIndex = Math.min(history.length - 1, newIndex + 1);
    }

    this.historyIndex.set(newIndex);

    // If we are at the end and go next, clear input (or if we were at -1)
    // Actually, standard behavior:
    // Up -> older messages. Down -> newer messages.
    // If we are at the latest message and press down, we might want to go back to empty or what was typed.
    // For simplicity:
    // If direction is next and we are at the last item, we can go to -1 (empty/current draft).

    if (
      direction === 'next' &&
      this.historyIndex() === history.length - 1 &&
      newIndex === history.length - 1
    ) {
      // We are already at the end, maybe we want to clear?
      // Let's stick to simple cycling for now or just clamping.
    }

    this.inputText.set(history[newIndex]);
  }

  cancelRequest() {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
      this.currentSubscription = null;
    }
    this.isLoading.set(false);

    // Mark the last message as cancelled if it's a pending model message
    this.messages.update((msgs) => {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.role === 'model' && !lastMsg.content) {
        const newMsgs = [...msgs];
        newMsgs[newMsgs.length - 1] = {
          ...lastMsg,
          content: 'Request cancelled.',
        };
        return newMsgs;
      }
      return msgs;
    });
  }

  sendMessage() {
    const input = this.inputText().trim();
    const image = this.selectedImage();

    if (!input && !image) return;

    // Cancel any pending request
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
    }

    // Add to history if it's a text input
    if (input) {
      this.inputHistory.update((h) => [...h, input]);
      this.historyIndex.set(-1);
    }

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

    this.currentSubscription = this.oracleService.generate(payload).subscribe({
      next: (result) => {
        this.messages.update((msgs) => {
          const newMsgs = [...msgs];
          const lastIdx = newMsgs.length - 1;
          newMsgs[lastIdx] = {
            ...newMsgs[lastIdx],
            content: result.response.blocks,
            sources: result.sources,
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
        this.currentSubscription = null;
      },
      complete: () => {
        this.isLoading.set(false);
        this.currentSubscription = null;
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

  private getInitialLearnMode(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('ng-lens-learn-mode');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  }

  private getInitialHistory(): string[] {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('ng-lens-history');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  }
}
