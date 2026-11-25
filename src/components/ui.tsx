import { createContext, useCallback, useContext, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { prepareImage, validateFile, type PreparedImage } from '../lib/util'

// ---------------- Icons ----------------
const P: Record<string, string> = {
  logo: 'M7 19V5l10 14V5',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  scan: 'M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M8 12h8',
  hash: 'M5 9h14M5 15h14M10 4L8 20M16 4l-2 16',
  at: 'M16 12a4 4 0 11-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1',
  caption: 'M4 6h16M4 12h16M4 18h10',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4',
  folder: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  upload: 'M12 16V4m0 0L7 9m5-5l5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  check: 'M5 12l5 5L20 7',
  save: 'M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  download: 'M12 4v12m0 0l-5-5m5 5l5-5M4 20h16',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.3-4.3',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
  logout: 'M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M16 8l4 4-4 4M20 12H9',
  plus: 'M12 5v14M5 12h14',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  alert: 'M12 9v4m0 4h.01M10.3 4l-8 14a2 2 0 001.7 3h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 100-18 9 9 0 000 18z',
  chevron: 'M6 9l6 6 6-6',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01',
  refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 118 0v3',
}

export function Icon({ name, size = 18 }: { name: keyof typeof P | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] ?? P.info} />
    </svg>
  )
}

export function Logo({ size = 30, text = true }: { size?: number; text?: boolean }) {
  return (
    <span className="logo">
      <span className="logo-mark" style={{ width: size, height: size }}>
        <Icon name="logo" size={size * 0.62} />
      </span>
      {text && <span className="logo-text">NEXORA</span>}
    </span>
  )
}

// ---------------- Toasts ----------------
interface Toast {
  id: number
  msg: string
  tone: 'ok' | 'err'
}
const ToastCtx = createContext<(msg: string, tone?: 'ok' | 'err') => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([])
  const n = useRef(0)
  const push = useCallback((msg: string, tone: 'ok' | 'err' = 'ok') => {
    const id = ++n.current
    setList((l) => [...l, { id, msg, tone }])
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3400)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            <Icon name={t.tone === 'ok' ? 'check' : 'alert'} size={16} />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

// ---------------- Basic elements ----------------
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'soft' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: string
}
export function Button({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...rest }: BtnProps) {
  return (
    <button {...rest} disabled={disabled || loading} className={`btn ${variant} ${size} ${className}`}>
      {loading ? <span className="spinner sm" /> : icon ? <Icon name={icon} size={size === 'sm' ? 15 : 17} /> : null}
      {children}
    </button>
  )
}

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function Badge({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'violet' | 'green' | 'amber' | 'gray' | 'red' }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="loading-box">
      <span className="spinner" />
      {label && <span>{label}</span>}
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="notice err" role="alert">
      <Icon name="alert" />
      <div style={{ flex: 1 }}>{message}</div>
      {onRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}

export function Notice({ children, tone = 'info', icon = 'info' }: { children: ReactNode; tone?: 'info' | 'warn'; icon?: string }) {
  return (
    <div className={`notice ${tone}`}>
      <Icon name={icon} />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function Empty({ icon = 'spark', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={22} />
      </div>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  )
}

export function Meter({ value, tone }: { value: number; tone?: 'auto' }) {
  const v = Math.max(0, Math.min(100, value))
  const c = tone === 'auto' ? (v >= 75 ? 'var(--green)' : v >= 50 ? 'var(--amber)' : 'var(--red)') : undefined
  return (
    <div className="meter" aria-label={`${v} out of 100`}>
      <div style={{ width: `${v}%`, background: c }} />
    </div>
  )
}

// ---------------- Image uploader ----------------
export function Uploader({
  image,
  onImage,
  compact,
}: {
  image: PreparedImage | null
  onImage: (i: PreparedImage | null) => void
  compact?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const take = async (file?: File | null) => {
    if (!file) return
    setErr('')
    const bad = validateFile(file)
    if (bad) return setErr(bad)
    setBusy(true)
    try {
      onImage(await prepareImage(file))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load this image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <input ref={input} type="file" hidden accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(e) => { void take(e.target.files?.[0]); e.target.value = '' }} />
      {image ? (
        <div className="preview">
          <img src={image.dataUrl} alt="Uploaded preview" />
          <div className="preview-bar">
            <span className="ellip">{image.name}</span>
            <div className="row">
              <Button size="sm" variant="soft" icon="refresh" onClick={() => input.current?.click()}>
                Replace
              </Button>
              <Button size="sm" variant="ghost" icon="trash" onClick={() => onImage(null)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`drop ${drag ? 'over' : ''} ${compact ? 'compact' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); void take(e.dataTransfer.files?.[0]) }}
        >
          {busy ? (
            <span className="spinner" />
          ) : (
            <>
              <div className="empty-icon"><Icon name="upload" size={22} /></div>
              <strong>Drag and drop a photo, or click to browse</strong>
              <span>JPG, JPEG, PNG or WEBP, up to 10 MB</span>
            </>
          )}
        </div>
      )}
      {err && <div className="field-error">{err}</div>}
    </div>
  )
}

// ---------------- Charts (SVG, no dependencies) ----------------
export function BarChart({ data, height = 150 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const w = 100 / data.length
  return (
    <svg viewBox={`0 0 100 ${height / 2}`} preserveAspectRatio="none" className="bars" style={{ height }}>
      <defs>
        <linearGradient id="barg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2F5BFF" />
          <stop offset="1" stopColor="#7B5CFF" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const h = (d.value / max) * (height / 2 - 6)
        return <rect key={d.label} x={i * w + w * 0.2} y={height / 2 - h} width={w * 0.6} height={Math.max(h, d.value ? 1 : 0.4)} rx={1.2} fill={d.value ? 'url(#barg)' : '#E6EAF4'} />
      })}
    </svg>
  )
}

export function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((a, b) => a + b.value, 0)
  const r = 40
  const c = 2 * Math.PI * r
  let off = 0
  return (
    <svg viewBox="0 0 100 100" width="150" height="150" role="img" aria-label="Platform share">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#EEF1F8" strokeWidth="14" />
      {total > 0 &&
        parts.filter((p) => p.value > 0).map((p) => {
          const len = (p.value / total) * c
          const el = <circle key={p.label} cx="50" cy="50" r={r} fill="none" stroke={p.color} strokeWidth="14" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} transform="rotate(-90 50 50)" />
          off += len
          return el
        })}
      <text x="50" y="54" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0B1B3F">{total}</text>
    </svg>
  )
}
