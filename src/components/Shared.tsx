import { Button, Field, Icon, Uploader, useToast } from './ui'
import { PLATFORM_LIST } from '../lib/platforms'
import { useWorkspace } from '../lib/workspace'
import { copyText } from '../lib/util'
import type { Level3, PlatformId } from '../types'

export function PlatformPicker({ value, onChange }: { value: PlatformId; onChange: (p: PlatformId) => void }) {
  return (
    <div className="chips" role="radiogroup" aria-label="Platform">
      {PLATFORM_LIST.map((p) => (
        <button key={p.id} type="button" role="radio" aria-checked={value === p.id} className={`chip ${value === p.id ? 'active' : ''}`} onClick={() => onChange(p.id)}>
          {p.name}
        </button>
      ))}
    </div>
  )
}

export function CopyButton({ text, label = 'Copy', size = 'sm', variant = 'soft', disabled }: { text: string; label?: string; size?: 'sm' | 'md'; variant?: 'soft' | 'ghost' | 'primary'; disabled?: boolean }) {
  const toast = useToast()
  return (
    <Button size={size} variant={variant} icon="copy" disabled={disabled || !text} onClick={async () => { const ok = await copyText(text); toast(ok ? "Copied to clipboard" : "Could not copy. Select the text and copy manually.", ok ? "ok" : "err") }}>
      {label}
    </Button>
  )
}

/** Photo + context + audience + platform, bound to the shared workspace. */
export function InputPanel({ compact, hideImage }: { compact?: boolean; hideImage?: boolean }) {
  const { ws, patch, setImage } = useWorkspace()
  return (
    <div className="stack">
      {!hideImage && <Uploader image={ws.image} onImage={setImage} compact={compact} />}
      <Field label="Extra context (optional)" hint="Mention the event, product, place or goal. NEXORA won't guess these from the photo.">
        <textarea value={ws.context} onChange={(e) => patch({ context: e.target.value })} placeholder="e.g. Launch day at our new cafe in Surat, targeting college students" rows={3} />
      </Field>
      <Field label="Target audience (optional)">
        <input type="text" value={ws.audience} onChange={(e) => patch({ audience: e.target.value })} placeholder="e.g. students, startup founders, travel lovers" />
      </Field>
      <Field label="Platform">
        <PlatformPicker value={ws.platform} onChange={(platform) => patch({ platform })} />
      </Field>
    </div>
  )
}

export function Levels({ level }: { level: Level3 }) {
  const n = level === 'high' ? 3 : level === 'medium' ? 2 : 1
  return (
    <span className="dots" aria-label={`${level}`}>
      {[1, 2, 3].map((i) => <i key={i} className={i <= n ? 'on' : ''} />)}
    </span>
  )
}

export function EstimateNote({ children }: { children?: React.ReactNode }) {
  return (
    <div className="notice info">
      <Icon name="info" />
      <div>{children ?? <><strong>AI-estimated, not live data.</strong> Popularity, competition and trends are model estimates. No live platform statistics are connected, and NEXORA never shows invented post counts.</>}</div>
    </div>
  )
}
