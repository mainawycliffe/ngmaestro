import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="app-footer" role="contentinfo">
      <div class="footer-content">
        <p class="footer-text">
          Built with ❤️ by
          <a
            href="https://mainawycliffe.dev"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
            aria-label="Visit developer portfolio"
          >
            Maina Wycliffe
          </a>
        </p>
        <div class="footer-links">
          <a
            href="https://github.com/mainawycliffe/ng-lens"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
            aria-label="View source code on GitHub"
          >
            View on GitHub
          </a>
          <span class="separator">•</span>
          <a
            href="https://github.com/mainawycliffe/ng-lens/issues"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
            aria-label="Report a bug on GitHub"
          >
            Report Bug
          </a>
          <span class="separator">•</span>
          <a
            href="https://github.com/sponsors/mainawycliffe"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
            aria-label="Sponsor on GitHub"
          >
            Sponsor
          </a>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .app-footer {
        background: var(--mat-sys-surface);
        border-top: 1px solid var(--mat-sys-outline-variant);
        padding: 2rem;
        margin-top: auto;

        .footer-content {
          max-width: 1800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
        }

        .footer-text {
          color: var(--mat-sys-on-surface-variant);
          font-size: 0.875rem;
          margin: 0;
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-link {
          color: var(--mat-sys-primary);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.875rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;

          &::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 2px;
            background: var(--mat-sys-primary);
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          &:hover {
            color: var(--mat-sys-primary);

            &::after {
              width: 100%;
            }
          }

          &:focus-visible {
            outline: 2px solid var(--mat-sys-primary);
            outline-offset: 4px;
            border-radius: 4px;
          }
        }

        .separator {
          color: var(--mat-sys-on-surface-variant);
          font-size: 0.875rem;
        }
      }

      @media (min-width: 768px) {
        .app-footer .footer-content {
          flex-direction: row;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class FooterComponent {}
