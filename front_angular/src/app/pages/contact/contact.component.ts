import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PublicLayoutComponent } from '../../layout/public/public-layout.component';
import { ContactService } from '../../core/services/contact.service';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    PublicLayoutComponent,
  ],
  template: `
    <app-public-layout>
      <h1 class="page-title">Contact</h1>

      <div class="contact-wrapper">
        <mat-card class="contact-card">
          <mat-card-content>
            @if (success()) {
              <div class="success-msg" data-testid="success-alert">
                Message envoyé ! Nous vous répondrons dès que possible.
              </div>
            }

            @if (!success()) {
              <form (ngSubmit)="submit()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nom</mat-label>
                  <input matInput name="name" [(ngModel)]="name"
                         data-testid="name-input" />
                  @if (nameError()) {
                    <mat-error data-testid="name-error">{{ nameError() }}</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" name="email" [(ngModel)]="email"
                         data-testid="email-input" />
                  @if (emailError()) {
                    <mat-error data-testid="email-error">{{ emailError() }}</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Message</mat-label>
                  <textarea matInput name="message" [(ngModel)]="message"
                            rows="5" data-testid="message-input"></textarea>
                  @if (messageError()) {
                    <mat-error data-testid="message-error">{{ messageError() }}</mat-error>
                  }
                </mat-form-field>

                @if (serverError()) {
                  <div class="error-msg" data-testid="server-error">{{ serverError() }}</div>
                }

                <button mat-raised-button color="primary" type="submit"
                        class="full-width submit-btn" [disabled]="loading()"
                        data-testid="submit-btn">
                  @if (loading()) { <mat-spinner diameter="22" /> } @else { Envoyer }
                </button>
              </form>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </app-public-layout>
  `,
  styles: [`
    .page-title {
      color: #bb86fc;
      font-weight: 400;
      margin-bottom: 1.5rem;
    }

    .contact-wrapper {
      display: flex;
      justify-content: center;
    }

    .contact-card {
      width: 100%;
      max-width: 560px;
      background: #2a2a2a !important;
      color: #e0e0e0;
    }

    .contact-card ::ng-deep .mat-mdc-form-field-input-control,
    .contact-card ::ng-deep .mat-mdc-floating-label,
    .contact-card ::ng-deep .mdc-text-field__input {
      color: #e0e0e0 !important;
    }

    .contact-card ::ng-deep .mat-mdc-floating-label:not(.mdc-floating-label--float-above) {
      color: #aaa !important;
    }

    .contact-card ::ng-deep .mdc-notched-outline__leading,
    .contact-card ::ng-deep .mdc-notched-outline__notch,
    .contact-card ::ng-deep .mdc-notched-outline__trailing {
      border-color: rgba(255, 255, 255, 0.3) !important;
    }

    .contact-card ::ng-deep .mdc-text-field--focused .mdc-notched-outline__leading,
    .contact-card ::ng-deep .mdc-text-field--focused .mdc-notched-outline__notch,
    .contact-card ::ng-deep .mdc-text-field--focused .mdc-notched-outline__trailing {
      border-color: #bb86fc !important;
    }

    .full-width { width: 100%; }

    .submit-btn {
      margin-top: 0.5rem;
      height: 48px;
    }

    .error-msg {
      color: #cf6679;
      border: 1px solid #cf6679;
      border-radius: 4px;
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .success-msg {
      color: #4caf50;
      border: 1px solid #4caf50;
      border-radius: 4px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
    }
  `],
})
export class ContactComponent {
  private readonly contactService = inject(ContactService);

  name = '';
  email = '';
  message = '';

  readonly loading = signal(false);
  readonly success = signal(false);
  readonly nameError = signal('');
  readonly emailError = signal('');
  readonly messageError = signal('');
  readonly serverError = signal('');

  submit(): void {
    this.nameError.set(this.name.trim() ? '' : 'Le nom est requis');
    this.emailError.set(
      !this.email.trim() ? "L'email est requis" :
      !isValidEmail(this.email.trim()) ? "L'email n'est pas valide" : ''
    );
    this.messageError.set(this.message.trim() ? '' : 'Le message est requis');

    if (this.nameError() || this.emailError() || this.messageError()) return;

    this.loading.set(true);
    this.serverError.set('');
    this.contactService.sendMessage({ name: this.name.trim(), email: this.email.trim(), message: this.message.trim() }).subscribe({
      next: () => {
        this.success.set(true);
        this.name = '';
        this.email = '';
        this.message = '';
      },
      error: () => {
        this.serverError.set('Une erreur est survenue. Veuillez réessayer.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
