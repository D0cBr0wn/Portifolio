<template>
  <div class="tech-badge-container">
    <a
      href="http://localhost:5173"
      class="tech-badge"
      title="Vue.js version"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 261.76 226.69" aria-label="Vue.js">
        <path d="M161.096.001l-30.225 52.351L100.647.001H-.005l130.877 226.688L261.749.001z" fill="#41b883"/>
        <path d="M161.096.001l-30.225 52.351L100.647.001H52.346l78.526 136.01L209.398.001z" fill="#34495e"/>
      </svg>
    </a>
    <a
      href="http://localhost:5174"
      class="tech-badge react-badge"
      title="React version"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348" aria-label="React">
        <circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
        <g stroke="#61dafb" stroke-width="1" fill="none">
          <ellipse rx="11" ry="4.2"/>
          <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
          <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
        </g>
      </svg>
    </a>
  </div>
</template>

<style scoped>
.tech-badge-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 9999;
}

.tech-badge {
  width: 28px;
  opacity: 0.35;
  transition: opacity 0.2s;
  display: block;
}

.tech-badge:hover {
  opacity: 0.8;
}

.react-badge {
  opacity: 0.35;
}

.tech-badge svg {
  width: 100%;
  height: auto;
  display: block;
}
</style>
