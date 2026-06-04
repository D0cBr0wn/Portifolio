const BADGE_STYLE: React.CSSProperties = {
  width: 28,
  opacity: 0.35,
  transition: 'opacity 0.2s',
  display: 'block',
}

const HOVER_STYLE: React.CSSProperties = { opacity: 0.8 }

function VueLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 261.76 226.69" aria-label="Vue.js" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <path d="M161.096.001l-30.225 52.351L100.647.001H-.005l130.877 226.688L261.749.001z" fill="#41b883" />
      <path d="M161.096.001l-30.225 52.351L100.647.001H52.346l78.526 136.01L209.398.001z" fill="#34495e" />
    </svg>
  )
}

function ReactLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348" aria-label="React" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
      <g stroke="#61dafb" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  )
}

export default function TechBadge() {
  return (
    <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 9999 }}>
      <a
        href="http://localhost:5173"
        title="Vue.js version"
        style={BADGE_STYLE}
        onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, HOVER_STYLE)}
        onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, BADGE_STYLE)}
      >
        <VueLogo />
      </a>
      <a
        href="http://localhost:5174"
        title="React version"
        style={{ ...BADGE_STYLE, opacity: 0.8 }}
        onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, { ...BADGE_STYLE, opacity: 1 })}
        onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, { ...BADGE_STYLE, opacity: 0.8 })}
      >
        <ReactLogo />
      </a>
    </div>
  )
}
