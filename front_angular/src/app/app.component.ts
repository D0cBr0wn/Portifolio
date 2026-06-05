import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TechBadgeComponent } from './shared/components/tech-badge.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TechBadgeComponent],
  template: '<router-outlet /><app-tech-badge />',
})
export class AppComponent {}
