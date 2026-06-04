import { Component } from '@angular/core';

@Component({
  selector: 'app-tech-badge',
  standalone: true,
  template: `
    <div class="badge-container">
      <a href="http://localhost:5173" title="Vue.js version" class="badge-link">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 261.76 226.69" aria-label="Vue.js">
          <path d="M161.096.001l-30.225 52.351L100.647.001H-.005l130.877 226.688L261.749.001z" fill="#41b883" />
          <path d="M161.096.001l-30.225 52.351L100.647.001H52.346l78.526 136.01L209.398.001z" fill="#34495e" />
        </svg>
      </a>
      <a href="http://localhost:5174" title="React version" class="badge-link">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348" aria-label="React">
          <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
          <g stroke="#61dafb" stroke-width="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      </a>
      <a href="http://localhost:5175" title="Angular version" class="badge-link active">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" aria-label="Angular">
          <path d="M125 30L31.9 63.2l14.2 123.1L125 230l78.9-43.7 14.2-123.1z" fill="#dd0031"/>
          <path d="M125 30v22.2-.1V230l78.9-43.7 14.2-123.1L125 30z" fill="#c3002f"/>
          <path d="M125 52.1L66.8 182.6h21.7l11.7-29.2h49.4l11.7 29.2H183L125 52.1zm17 83.3h-34l17-40.9 17 40.9z" fill="#fff"/>
        </svg>
      </a>
    </div>
  `,
  styles: [`
    .badge-container {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.5rem;
      z-index: 9999;
    }

    .badge-link {
      display: block;
      width: 28px;
      opacity: 0.35;
      transition: opacity 0.2s;
      text-decoration: none;

      svg {
        width: 100%;
        height: auto;
        display: block;
      }

      &:hover { opacity: 1; }
      &.active { opacity: 0.7; }
    }
  `],
})
export class TechBadgeComponent {}
