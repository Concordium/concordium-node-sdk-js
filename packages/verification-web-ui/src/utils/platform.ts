/**
 * Browser OS after Camera opens the merchant https page.
 * The QR itself is the same on every phone.
 */
export function isIosDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isAndroidDevice(): boolean {
    return /android/i.test(navigator.userAgent);
}

export function isPhoneBrowser(): boolean {
    return isIosDevice() || isAndroidDevice();
}

/** Apple default App Clip links need iOS 16.4+. Older iOS goes to the App Store. */
export function isIosDefaultAppClipSupported(): boolean {
    if (!isIosDevice()) return false;
    const match = navigator.userAgent.match(/OS (\d+)[._](\d+)/);
    if (!match) return false;
    const major = Number(match[1]);
    const minor = Number(match[2]);
    return major > 16 || (major === 16 && minor >= 4);
}
