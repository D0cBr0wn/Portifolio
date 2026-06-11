import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MessageDetailDialogComponent } from './message-detail-dialog.component';

const dialogRefMock = { close: jest.fn() };
const dialogData = {
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: '2025-06-01T10:00:00.000Z',
  message: 'Bonjour, ceci est un message de test complet.',
};

describe('MessageDetailDialogComponent', () => {
  let fixture: ComponentFixture<MessageDetailDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MessageDetailDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    fixture = TestBed.createComponent(MessageDetailDialogComponent);
    fixture.detectChanges();
  });

  it('affiche le nom de l\'expéditeur dans le titre', () => {
    const title = fixture.nativeElement.querySelector('[data-testid="dialog-title"]');
    expect(title.textContent).toContain('Alice');
  });

  it('affiche le message complet', () => {
    const body = fixture.nativeElement.querySelector('[data-testid="dialog-message"]');
    expect(body.textContent).toContain(dialogData.message);
  });

  it('affiche l\'email et la date', () => {
    expect(fixture.nativeElement.textContent).toContain('alice@example.com');
  });

  it('affiche un bouton Supprimer', () => {
    const btn = fixture.nativeElement.querySelector('[data-testid="modal-delete-btn"]');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Supprimer');
  });
});
