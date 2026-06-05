const BASE: React.CSSProperties = { width: 28, height: 28, opacity: 0.35, transition: 'opacity 0.2s', display: 'block' }
const ACTIVE: React.CSSProperties = { ...BASE, opacity: 0.7 }

function VueLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 261.76 226.69" aria-label="Vue.js" style={{ width: '100%', height: '100%', display: 'block' }}>
      <path d="M161.096.001l-30.225 52.351L100.647.001H-.005l130.877 226.688L261.749.001z" fill="#41b883" />
      <path d="M161.096.001l-30.225 52.351L100.647.001H52.346l78.526 136.01L209.398.001z" fill="#34495e" />
    </svg>
  )
}

function ReactLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348" aria-label="React" style={{ width: '100%', height: '100%', display: 'block' }}>
      <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
      <g stroke="#61dafb" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  )
}

function navigate(port: number) {
  window.location.href = `http://localhost:${port}${window.location.pathname}`
}

function Badge({ port, title, active, children }: { port: number; title: string; active?: boolean; children: React.ReactNode }) {
  const base = active ? ACTIVE : BASE
  return (
    <a
      href="#"
      title={title}
      style={base}
      onClick={(e) => { e.preventDefault(); navigate(port) }}
      onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, { opacity: 1 })}
      onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, { opacity: String(base.opacity) })}
    >
      {children}
    </a>
  )
}

function AngularLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" aria-label="Angular" style={{ width: '100%', height: '100%', display: 'block' }}>
      <path d="M125 30L31.9 63.2l14.2 123.1L125 230l78.9-43.7 14.2-123.1z" fill="#dd0031"/>
      <path d="M125 30v22.2-.1V230l78.9-43.7 14.2-123.1L125 30z" fill="#c3002f"/>
      <path d="M125 52.1L66.8 182.6h21.7l11.7-29.2h49.4l11.7 29.2H183L125 52.1zm17 83.3h-34l17-40.9 17 40.9z" fill="#fff"/>
    </svg>
  )
}

export default function TechBadge() {
  return (
    <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 9999 }}>
      <Badge port={5173} title="Vue.js version">
        <VueLogo />
      </Badge>
      <Badge port={5174} title="React version" active>
        <ReactLogo />
      </Badge>
      <Badge port={5175} title="Angular version">
        <AngularLogo />
      </Badge>
    </div>
  )
}
