import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VenueFormDialogComponent } from './venue-form-dialog.component';

const dialogRefMock = { close: jest.fn() };

function createFixture(initial: object | null = null): ComponentFixture<VenueFormDialogComponent> {
  TestBed.configureTestingModule({
    imports: [VenueFormDialogComponent],
    providers: [
      provideNoopAnimations(),
      { provide: MAT_DIALOG_DATA, useValue: { initial } },
      { provide: MatDialogRef, useValue: dialogRefMock },
    ],
  });
  return TestBed.createComponent(VenueFormDialogComponent);
}

describe('VenueFormDialogComponent', () => {
  beforeEach(() => dialogRefMock.close.mockClear());

  it('affiche "Nouveau lieu" quand initial est null', () => {
    const fixture = createFixture(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nouveau lieu');
  });

  it('affiche "Modifier le lieu" quand initial est fourni', () => {
    const fixture = createFixture({ id: 1, name: 'Zénith', city: 'Paris' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Modifier le lieu');
  });

  it('pré-remplit les propriétés avec initial', () => {
    const fixture = createFixture({ id: 1, name: 'Olympia', city: 'Paris', zipCode: '75018' });
    fixture.detectChanges();
    expect(fixture.componentInstance.name).toBe('Olympia');
    expect(fixture.componentInstance.city).toBe('Paris');
    expect(fixture.componentInstance.zipCode).toBe('75018');
  });

  it('ferme le dialog sur Annuler', () => {
    const fixture = createFixture(null);
    fixture.detectChanges();
    const cancelBtn = fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement;
    cancelBtn.click();
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  it('affiche une erreur si nom ou ville vide à la soumission', () => {
    const fixture = createFixture(null);
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(fixture.componentInstance.nameError()).toBeTruthy();
    expect(fixture.componentInstance.cityError()).toBeTruthy();
  });
});
