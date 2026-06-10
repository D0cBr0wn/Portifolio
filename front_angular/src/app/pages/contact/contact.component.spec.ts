import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ContactComponent } from './contact.component';
import { ContactService } from '../../core/services/contact.service';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let contactService: jest.Mocked<ContactService>;

  beforeEach(() => {
    const contactServiceMock = { sendMessage: jest.fn(), getMessages: jest.fn() };

    TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ContactService, useValue: contactServiceMock },
      ],
    });
    fixture = TestBed.createComponent(ContactComponent);
    contactService = TestBed.inject(ContactService) as jest.Mocked<ContactService>;
    fixture.detectChanges();
  });

  it('affiche le titre Contact', () => {
    expect(fixture.nativeElement.textContent).toContain('Contact');
  });

  it('affiche les trois champs du formulaire', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input, textarea') as NodeListOf<HTMLInputElement>;
    expect(inputs.length).toBeGreaterThanOrEqual(3);
  });

  it('bloque la soumission si les champs sont vides', () => {
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(fixture.componentInstance.nameError()).toBeTruthy();
    expect(fixture.componentInstance.emailError()).toBeTruthy();
    expect(fixture.componentInstance.messageError()).toBeTruthy();
    expect(contactService.sendMessage).not.toHaveBeenCalled();
  });

  it("affiche une erreur si l'email est invalide", () => {
    fixture.componentInstance.name = 'Alice';
    fixture.componentInstance.email = 'not-an-email';
    fixture.componentInstance.message = 'Bonjour';
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(fixture.componentInstance.emailError()).toContain('valide');
    expect(contactService.sendMessage).not.toHaveBeenCalled();
  });

  it('affiche le message de succès et réinitialise le formulaire', () => {
    contactService.sendMessage.mockReturnValue(of({ id: 1, name: 'Alice', email: 'alice@example.com', message: 'Bonjour', createdAt: '2025-06-01T10:00:00.000Z' }));
    fixture.componentInstance.name = 'Alice';
    fixture.componentInstance.email = 'alice@example.com';
    fixture.componentInstance.message = 'Bonjour';
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(fixture.componentInstance.success()).toBe(true);
    expect(fixture.componentInstance.name).toBe('');
    expect(fixture.componentInstance.email).toBe('');
    expect(fixture.componentInstance.message).toBe('');
    const successEl = fixture.nativeElement.querySelector('[data-testid="success-alert"]');
    expect(successEl).toBeTruthy();
  });

  it('affiche une erreur serveur en cas d\'échec', () => {
    contactService.sendMessage.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.name = 'Alice';
    fixture.componentInstance.email = 'alice@example.com';
    fixture.componentInstance.message = 'Bonjour';
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(fixture.componentInstance.serverError()).toBeTruthy();
  });

  it('appelle sendMessage avec les données saisies', () => {
    contactService.sendMessage.mockReturnValue(of({ id: 1, name: 'Alice', email: 'alice@example.com', message: 'Bonjour', createdAt: '2025-06-01T10:00:00.000Z' }));
    fixture.componentInstance.name = 'Alice';
    fixture.componentInstance.email = 'alice@example.com';
    fixture.componentInstance.message = 'Bonjour';
    fixture.componentInstance.submit();
    expect(contactService.sendMessage).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com', message: 'Bonjour' });
  });
});
