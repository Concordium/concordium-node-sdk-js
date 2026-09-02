/**
 * iOS clipboard handoff for WalletConnect URI (no bridge API).
 *
 * Format: ccd-idapp-bridge:v1:<walletConnectUri>
 * Written on Open with ID App / store redirect (user gesture).
 * ID app reads on Create Account (Allow Paste).
 *
 * Android: do NOT write clipboard (avoids Chrome/OEM "copied" toasts).
 * Android uses full wc: deep link + Play Install Referrer instead.
 */

export const IOS_BRIDGE_CLIPBOARD_PREFIX = 'ccd-idapp-bridge:v1:'

export function buildIosBridgeClipboardPayload(walletConnectUri: string): string {
  return `${IOS_BRIDGE_CLIPBOARD_PREFIX}${walletConnectUri}`
}

export function parseIosBridgeClipboardPayload(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const text = raw.trim()
  if (!text.startsWith(IOS_BRIDGE_CLIPBOARD_PREFIX)) return null
  const uri = text.slice(IOS_BRIDGE_CLIPBOARD_PREFIX.length).trim()
  return uri.startsWith('wc:') ? uri : null
}

function isIOS(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream
  )
}

/**
 * Write wc: URI to clipboard (iOS only). Android always returns false (no write).
 * Must run in a user-gesture context on iOS. Fail-open.
 */
export async function writeIosBridgeClipboardHandoff(walletConnectUri: string): Promise<boolean> {
  if (!walletConnectUri?.startsWith('wc:')) return false
  if (!isIOS()) {
    // Explicit no-op on Android — deep link + Play referrer only.
    return false
  }

  const payload = buildIosBridgeClipboardPayload(walletConnectUri)

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload)
      console.info('[IDApp] iOS clipboard handoff WRITE ok', {
        payloadLength: payload.length,
        uriPreview: `${walletConnectUri.slice(0, 28)}…`,
      })
      return true
    }
  } catch (error) {
    console.warn('[IDApp] iOS clipboard writeText failed, trying execCommand', error)
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = payload
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, payload.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    console.info('[IDApp] iOS clipboard handoff WRITE (execCommand)', { ok })
    return ok
  } catch (error) {
    console.warn('[IDApp] iOS clipboard handoff WRITE failed', error)
    return false
  }
}
