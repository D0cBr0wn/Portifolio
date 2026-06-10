import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BackofficeMessagesComponent } from './messages.component';
import { ContactService } from '../../../core/services/contact.service';
import { AuthStore } from '../../../core/stores/auth.store';

const mockMessages = [
  { id: 1, name: 'Alice', email: 'alice@example.com', message: 'Bonjour, je voulais vous contacter concernant votre portfolio.', createdAt: '2025-06-01T10:00:00.000Z' },
  { id: 2, name: 'Bob', email: 'bob@example.com', message: 'Super !', createdAt: '2025-06-02T12:00:00.000Z' },
];

describe('BackofficeMessagesComponent', () => {
  let fixture: ComponentFixture<BackofficeMessagesComponent>;
  let contactService: jest.Mocked<ContactService>;

  beforeEach(() => {
    const contactServiceMock = { getMessages: jest.fn(), sendMessage: jest.fn() };
    const authStoreMock = { isAdmin: jest.fn().mockReturnValue(true), isAuthenticated: jest.fn().mockReturnValue(true), logout: jest.fn() };

    TestBed.configureTestingModule({
      imports: [BackofficeMessagesComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ContactService, useValue: contactServiceMock },
        { provide: AuthStore, useValue: authStoreMock },
      ],
    });
    fixture = TestBed.createComponent(BackofficeMessagesComponent);
    contactService = TestBed.inject(ContactService) as jest.Mocked<ContactService>;
  });

  it('affiche le titre de la page', () => {
    contactService.getMessages.mockReturnValue(of([]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Messages de contact');
  });

  it('appelle getMessages au montage', () => {
    contactService.getMessages.mockReturnValue(of([]));
    fixture.detectChanges();
    expect(contactService.getMessages).toHaveBeenCalledTimes(1);
  });

  it('affiche les messages dans le tableau', () => {
    contactService.getMessages.mockReturnValue(of(mockMessages));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Alice');
    expect(fixture.nativeElement.textContent).toContain('bob@example.com');
  });

  it('tronque les messages longs', () => {
    const longMessage = 'A'.repeat(80);
    contactService.getMessages.mockReturnValue(of([
      { id: 1, name: 'Test', email: 'test@test.com', message: longMessage, createdAt: '2025-01-01T00:00:00.000Z' },
    ]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(longMessage);
    expect(fixture.nativeElement.textContent).toContain('A'.repeat(60) + '…');
  });

  it('affiche une erreur si la requête échoue', () => {
    contactService.getMessages.mockReturnValue(throwError(() => new Error('500')));
    fixture.detectChanges();
    const errorEl = fixture.nativeElement.querySelector('[data-testid="messages-error"]');
    expect(errorEl).toBeTruthy();
  });
});
