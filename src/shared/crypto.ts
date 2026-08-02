import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

/**
 * Backup encryption (AES-256-GCM) — pure Node module so it is testable under
 * Vitest. File layout:
 *   magic (14B) | meta-length (8B hex) | meta JSON | auth tag (16B) | ciphertext
 */
export const BACKUP_MAGIC = 'CRM-EASY-BACKUP\x01'

export function encryptBackup(plain: Buffer, passphrase: string): Buffer {
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const key = scryptSync(passphrase, salt, 32)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const body = Buffer.concat([cipher.update(plain), cipher.final()])
  const tag = cipher.getAuthTag()
  const meta = Buffer.from(
    JSON.stringify({ v: 1, salt: salt.toString('base64'), iv: iv.toString('base64') }),
    'utf8',
  )
  const magic = Buffer.from(BACKUP_MAGIC, 'utf8')
  const header = Buffer.concat([
    magic,
    Buffer.from(meta.length.toString(16).padStart(8, '0'), 'utf8'),
  ])
  return Buffer.concat([header, meta, tag, body])
}

/** Returns the plaintext, or null when the blob is not ours or the passphrase is wrong. */
export function decryptBackup(blob: Buffer, passphrase: string): Buffer | null {
  const magic = Buffer.from(BACKUP_MAGIC, 'utf8')
  if (blob.length < magic.length + 8 || !blob.subarray(0, magic.length).equals(magic)) return null
  let pos = magic.length
  const lenHex = blob.subarray(pos, pos + 8).toString('utf8')
  const metaLength = Number.parseInt(lenHex, 16)
  if (Number.isNaN(metaLength) || metaLength <= 0) return null
  pos += 8
  if (blob.length < pos + metaLength + 16) return null
  const meta = JSON.parse(blob.subarray(pos, pos + metaLength).toString('utf8')) as {
    salt: string
    iv: string
  }
  pos += metaLength
  const tag = blob.subarray(pos, pos + 16)
  pos += 16
  const body = blob.subarray(pos)
  const key = scryptSync(passphrase, Buffer.from(meta.salt, 'base64'), 32)
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(meta.iv, 'base64'))
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(body), decipher.final()])
  } catch {
    return null
  }
}

/** Read the embedded schema version from a decrypted/plain SQLite dump. */
export function parseSchemaVersion(sqliteBytes: Buffer): number | null {
  const needle = Buffer.from('drizzle', 'utf8')
  // Schema version lives in the drizzle journal SQL text; scan first 64KB.
  const haystack = sqliteBytes.subarray(0, 64 * 1024)
  const idx = haystack.indexOf(needle)
  if (idx === -1) return null
  const snippet = haystack.subarray(idx, idx + 1200).toString('utf8')
  const match = /\d+/.exec(snippet.replace(/[^\d\s]/g, ' ').trim())
  return match ? Number.parseInt(match[0], 10) : null
}
