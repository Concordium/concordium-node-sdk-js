/**
 * iOS bridge handoff via clipboard — mirrors Android Play Install Referrer.
 *
 * Android: Play referrer carries install_id → app calls deferred-match.
 * iOS:    clipboard carries install_id + browser info → app calls deferred-match.
 *
 * Never put the raw wc: URI on the clipboard (that bypasses bridge APIs).
 *
 * Formats:
 *   v3: ccd-idapp-bridge:v3:<json>  { install_id, browser }
 *   v2: ccd-idapp-bridge:v2:install_id=<id>  (legacy install_id only)
 *
 * Written after session/register succeeds. ID app reads on Create Account
 * (after an in-app explanation, then iOS "Allow Paste").
 */

export const IOS_BRIDGE_CLIPBOARD_PREFIX_V3 = 'ccd-idapp-bridge:v3:'
export const IOS_BRIDGE_CLIPBOARD_PREFIX_V2 = 'ccd-idapp-bridge:v2:install_id='

/** @deprecated v1 put raw wc: on clipboard — no longer written */
export const IOS_BRIDGE_CLIPBOARD_PREFIX = 'ccd-idapp-bridge:v1:'

export type IosBridgeBrowserInfo = {
  user_agent: string
  language: string
  languages: string[]
  platform: string
  timezone: string
  screen: string
  vendor: string
  page_url: string
  ts: number
}

export type IosBridgeClipboardPayloadV3 = {
  install_id: string
  browser: IosBridgeBrowserInfo
}

export function collectIosBridgeBrowserInfo(): IosBridgeBrowserInfo {
  const languages =
    typeof navigator !== 'undefined' && Array.isArray(navigator.languages)
      ? navigator.languages.slice(0, 5).filter((l) => typeof l === 'string')
      : []

  let timezone = ''
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    timezone = ''
  }

  return {
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent || '' : '',
    language: typeof navigator !== 'undefined' ? navigator.language || '' : '',
    languages,
    platform: typeof navigator !== 'undefined' ? navigator.platform || '' : '',
    timezone,
    screen:
      typeof window !== 'undefined' && window.screen
        ? `${window.screen.width}x${window.screen.height}`
        : '',
    vendor: typeof navigator !== 'undefined' ? navigator.vendor || '' : '',
    page_url:
      typeof location !== 'undefined' ? String(location.href || '').split('#')[0] : '',
    ts: Date.now(),
  }
}

export function buildIosBridgeClipboardPayload(installId: string): string {
  const payload: IosBridgeClipboardPayloadV3 = {
    install_id: installId,
    browser: collectIosBridgeBrowserInfo(),
  }
  return `${IOS_BRIDGE_CLIPBOARD_PREFIX_V3}${JSON.stringify(payload)}`
}

/**
 * Write install_id + browser info. Must run in a user-gesture context when possible.
 * Fail-open: clipboard errors must not block store redirect.
 */
export async function writeIosBridgeClipboardHandoff(installId: string): Promise<boolean> {
  if (!installId || typeof installId !== 'string') return false

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream
  if (!isIOS) return false

  const payload = buildIosBridgeClipboardPayload(installId)

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload)
      console.info('[IDApp Bridge] iOS clipboard handoff WRITE ok', {
        install_id: installId,
        payloadLength: payload.length,
        version: 3,
      })
      return true
    }
  } catch (error) {
    console.warn('[IDApp Bridge] iOS clipboard writeText failed, trying execCommand', error)
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = payload
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    console.info('[IDApp Bridge] iOS clipboard handoff WRITE (execCommand)', {
      ok,
      install_id: installId,
      version: 3,
    })
    return ok
  } catch (error) {
    console.warn('[IDApp Bridge] iOS clipboard handoff WRITE failed', error)
    return false
  }
}
