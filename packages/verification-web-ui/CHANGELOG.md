# Changelog

## Unreleased

### Added

- The `network` option accepts a custom network, identified by its chain ID (`ccd:` followed by the first 32 hex
  characters of the genesis block hash), with optional wallet deep-link schemes:
  `{ chainId: 'ccd:<prefix>', walletDeepLinks: { ios: 'mywallet', android: 'mywallet-wc' } }`. Without
  `walletDeepLinks`, the UI doesn't deep link into a wallet and falls back to the QR code / WalletConnect URI.
  `'mainnet'` and `'testnet'` keep their chain IDs (apart from the deep-link fixes below).
- Exported the `NetworkConfig`, `CustomNetworkConfig`, `NamedNetwork` and `WalletDeepLinks` types.

### Fixed

- The configured `network` option now applies everywhere. `VITE_NETWORK` is only its default, used when the option is
  not set; before, some components read `VITE_NETWORK` directly and ignored the option. `VITE_CHAIN_ID_TESTNET` and
  `VITE_CHAIN_ID_MAINNET` are optional overrides for the named networks' chain IDs, which default to the testnet and
  mainnet genesis-hash chain IDs; before, leaving them unset could send an `undefined` chain ID to the wallet.
- Mobile app detection and deep links used schemes the Concordium Wallet apps don't register: `cryptoxmainnet://` /
  `cryptox-wc-mainnet://` on mainnet instead of `cryptox://` / `cryptox-wc://`, and `cryptox-wc-testnet://` on
  Android testnet instead of `cryptox-wc://`.

### 0.2.1

**Mobile deep link and session handling improvements:**

- Unified the deep link approach for both Android and iOS, using a direct link and a single fallback to the appropriate app store if the wallet app is not detected, simplifying the previous platform-specific logic.
- Added robust event handling to recover approved sessions if the user returns to the page after switching apps.
- Ensured the `__CONCORDIUM_WC_CONFIG__` global is set up correctly in SDK-managed mode to avoid connection issues.

**Desktop scan and QR code experience:**

- Removed the "Verify with Browser Wallet" button and all related logic and UI, focusing the desktop scan modal solely on QR code-based flows.
- Updated QR code generation to use a redirect URL (`buildQrRedirectUrl`), so that camera scans reliably open a page that then deep-links into installed wallets, improving cross-device usability.
- Added a warning message when the QR code page is served from localhost, alerting users that camera scans will not work from another device.

**Wallet deep link and opening logic enhancements:**

- Refactored mobile wallet opening logic to return a boolean indicating success, and added an option to skip automatic app store redirection if desired.
- Simplified the deep link format for Concordium ID, removing the unused redirect parameter.

### 0.2.0

- Enhanced WalletConnect integration and improved mobile app detection.
- Refactored popup utility and session detection for improved readability and consistency.
- Updated package metadata and publish setup (including `repository` and `engines` fields).
- Added ESLint configuration and aligned scripts/dependencies with lint-first workflows.
- Fixed loading video asset import ordering and corrected asset path casing.
- Updated `@walletconnect/types` and related dependency/configuration adjustments.
- Removed unused example integration and obsolete configuration files.

## 0.1.0

- Initial release
