# Changelog

## Unreleased

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
