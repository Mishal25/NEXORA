import { hashify } from './util'

/** Builds the final post text exactly as it will be copied / downloaded. Only real @handles are included; plain names are suggestions, not tags. */
export function composePost(caption: string, tags: string[], accounts: string[]): string {
  return [caption.trim(), accounts.filter((a) => a.trim().startsWith('@')).join(' '), tags.map(hashify).join(' ')].filter(Boolean).join('\n\n')
}
