import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

interface AngularVersion {
  value: string;
  label: string;
}

@Component({
  selector: 'app-header',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header" role="banner">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo">
            <div class="logo-icon-wrapper">
              <mat-icon class="logo-icon">auto_awesome</mat-icon>
            </div>
            <span class="logo-text">NgOracle</span>
          </div>
          <span class="tagline" role="doc-subtitle"
            >Chat with Angular Docs, powered by Gemini</span
          >
        </div>

        <div class="header-actions">
          <div class="version-selector-wrapper">
            <mat-form-field appearance="outline" class="version-selector">
              <mat-label>Angular Version</mat-label>
              <mat-select
                [value]="selectedVersion()"
                (valueChange)="versionChange.emit($event)"
                aria-label="Select Angular version"
              >
                @for (version of versions(); track version.value) {
                  <mat-option [value]="version.value">
                    {{ version.label }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
            @if (selectedVersion() === 'auto') {
              <mat-icon
                class="info-icon"
                matTooltip="Select a specific version for more precise results"
                >info</mat-icon
              >
            }
          </div>

          <div class="divider"></div>

          <!-- Font Size Controls -->
          <div class="font-controls">
            <button
              mat-icon-button
              (click)="decreaseFontSize()"
              [disabled]="fontSize() <= 12"
              matTooltip="Decrease font size"
            >
              <mat-icon>text_decrease</mat-icon>
            </button>
            <span class="font-size-label">{{ fontSize() }}px</span>
            <button
              mat-icon-button
              (click)="increaseFontSize()"
              [disabled]="fontSize() >= 24"
              matTooltip="Increase font size"
            >
              <mat-icon>text_increase</mat-icon>
            </button>
          </div>

          <!-- Theme Toggle -->
          <button
            mat-icon-button
            [matMenuTriggerFor]="themeMenu"
            matTooltip="Change theme"
          >
            <mat-icon>{{ themeIcon() }}</mat-icon>
          </button>
          <mat-menu #themeMenu="matMenu">
            <button mat-menu-item (click)="themeChange.emit('light')">
              <mat-icon>light_mode</mat-icon>
              <span>Light</span>
            </button>
            <button mat-menu-item (click)="themeChange.emit('dark')">
              <mat-icon>dark_mode</mat-icon>
              <span>Dark</span>
            </button>
            <button mat-menu-item (click)="themeChange.emit('system')">
              <mat-icon>brightness_auto</mat-icon>
              <span>System</span>
            </button>
          </mat-menu>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .app-header {
        background: var(--mat-sys-surface);
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        padding: 1rem 2rem;
        position: sticky;
        top: 0;
        z-index: 100;
        transition: all 0.3s ease;

        .header-content {
          max-width: 1800px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;

          .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin: 0;
            cursor: default;
            user-select: none;

            .logo-icon-wrapper {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 36px;
              background: linear-gradient(135deg, #dd0031 0%, #c3002f 100%);
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(221, 0, 49, 0.25);
              transition: transform 0.3s ease;

              .logo-icon {
                color: white;
                font-size: 20px;
                width: 20px;
                height: 20px;
              }
            }

            &:hover .logo-icon-wrapper {
              transform: rotate(-10deg) scale(1.05);
            }

            .logo-text {
              color: var(--mat-sys-on-surface);
              /* Removed gradient text for better visibility/compatibility */
            }
          }

          .tagline {
            color: var(--mat-sys-on-surface-variant);
            font-size: 0.875rem;
            display: none;

            @media (min-width: 768px) {
              display: inline;
            }
          }
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .version-selector-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .version-selector {
            min-width: 160px;
            margin: 0;

            /* Compact form field */
            ::ng-deep .mat-mdc-form-field-subscript-wrapper {
              display: none;
            }
          }

          .info-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: var(--mat-sys-secondary);
            cursor: help;
            opacity: 0.7;

            &:hover {
              opacity: 1;
            }
          }
        }

        .divider {
          width: 1px;
          height: 24px;
          background-color: var(--mat-sys-outline-variant);
          margin: 0 0.5rem;
        }

        .font-controls {
          display: flex;
          align-items: center;
          background: var(--mat-sys-surface-container-low);
          border-radius: 100px;
          padding: 0 4px;
          border: 1px solid var(--mat-sys-outline-variant);

          .font-size-label {
            font-size: 0.75rem;
            font-weight: 500;
            min-width: 32px;
            text-align: center;
            font-variant-numeric: tabular-nums;
          }

          button {
            width: 32px;
            height: 32px;
            padding: 0;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
        }
      }

      @media (max-width: 768px) {
        .app-header {
          padding: 1rem;

          .header-content {
            flex-direction: row; /* Keep row for mobile to fit toggle */
            gap: 1rem;
          }

          .logo-section {
            flex-direction: row;
            gap: 0.5rem;
            text-align: left;
          }

          .header-actions {
            width: auto;

            .version-selector,
            .font-controls,
            .divider {
              display: none; /* Hide extra controls on mobile for now */
            }
          }
        }
      }
    `,
  ],
})
export class HeaderComponent {
  selectedVersion = input.required<string>();
  versions = input.required<AngularVersion[]>();
  versionChange = output<string>();

  fontSize = input.required<number>();
  fontSizeChange = output<number>();

  theme = input.required<'light' | 'dark' | 'system'>();
  themeChange = output<'light' | 'dark' | 'system'>();

  increaseFontSize() {
    this.fontSizeChange.emit(this.fontSize() + 1);
  }

  decreaseFontSize() {
    this.fontSizeChange.emit(this.fontSize() - 1);
  }

  themeIcon() {
    switch (this.theme()) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'system':
        return 'brightness_auto';
    }
  }
}
