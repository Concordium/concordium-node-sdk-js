// Concordium ID App Popup Utility
import appStoreLogo from '@/assets/appstore-icon.svg';
import concordiumLogo from '@/assets/concordium-modal-logo.svg';
import playStoreLogo from '@/assets/playstore-icon.svg';
import { PopupConstants } from '@/constants/popup.constants';

/**
 * Interface for popup configuration options
 */
export interface PopupOptions {
    walletConnectUri?: string;
    walletConnectSessionTopic?: string;
    onCreateAccount?: () => Promise<unknown>;
    onClose?: () => void;
}

/**
 * Concordium ID App Popup Manager
 * Handles displaying popups for WalletConnect integration and account creation
 */
export class ConcordiumIDAppPopup {
    /**
     * Injects the popup styles into the document head
     * Only injects once per page load
     */
    private static injectPopupStyles(): void {
        if (document.getElementById(PopupConstants.ELEMENT_IDS.popupStyles)) return;

        const style = document.createElement('style');
        style.id = PopupConstants.ELEMENT_IDS.popupStyles;
        style.innerHTML = `
    .concordium-authCode {
      margin: 16px auto; 
      width: 86px;
      height: 86px;
      border: 2px solid #0047ab; 
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      font-size: 20px;
      color: #0047ab;
      border-radius: 100%;
      border: 2.15px solid #1143A7;
      background: linear-gradient(180deg, #FFF 0%, #EEE 100%);
    }
    
    .concordium-sdk-popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: concordium-fadeIn 0.2s ease-in-out;
    }

    @keyframes concordium-fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .concordium-sdk-popup-box {
      position: relative;
      background: #fff;
      border-radius: 12px;
      text-align: center;
      max-width: 330px;
      width: 100%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: concordium-slideUp 0.3s ease-out;
    }

    @keyframes concordium-slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .concordium-app-message {
      padding: 1.5rem 2rem;
    }

    .concordium-no-app-msg {
      padding: 1.5rem 2rem;
      background: #F2F1F1;
      border-radius: 0 0 12px 12px;
    }

    .concordium-sdk-close-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      color: #555;
      transition: color 0.2s;
    }

    .concordium-sdk-close-btn:hover {
      color: #000;
    }

    .concordium-sdk-step { 
      display: block; 
    }

    .concordium-sdk-logo {
      display: block;
      margin: 0 auto 1rem;
      max-width: 120px;
    }

    .concordium-sdk-copy {
      color: #0D121C;
      text-align: center;
      font-size: 16px;
      font-style: normal;
      font-weight: 600;
      line-height: 130%; 
      letter-spacing: -0.25px;
      margin-bottom: 32px;
    }

    .concordium-sdk-btns {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 32px 0 0 0;
    }

    .concordium-sdk-btn {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .concordium-sdk-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .concordium-sdk-btn--primary {
      background-color: #004a93;
      color: #fff;
    }

    .concordium-sdk-btn--primary:hover:not(:disabled) {
      background-color: #003a73;
    }

    .concordium-sdk-btn--secondary {
      background-color: #fff;
      color: #000;
      border: 2px solid #000;
    }

    .concordium-sdk-btn--secondary:hover:not(:disabled) {
      background-color: #f5f5f5;
    }

    .concordium-sdk-install {
      color: #0D121C;
      text-align: center;
      font-size: 13px;
      font-style: normal;
      font-weight: 600;
      line-height: 130%;
      letter-spacing: -0.25px;
      margin: 0 0 20px 0;
    }

    .concordium-sdk-store-links {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .concordium-sdk-store-links img {
      height: 36px;
      display: block;
      transition: transform 0.2s;
    }

    .concordium-sdk-store-links a:hover img {
      transform: scale(1.05);
    }

    .concordium-Rtable {
      display: flex;
      flex-wrap: wrap;
      padding: 0;
    }

    .concordium-Rtable-cell {
      box-sizing: border-box;
      flex-grow: 1;
      width: 100%;
      list-style: none;
      text-align: center;
    }

    .concordium-dot {
      height: 16px;
      width: 16px;
      background-color: #1143A7;
      border-radius: 50%;
      display: inline-block;
      z-index: 2;
      position: relative;
    }

    .concordium-dot-no-fill {
      height: 16px;
      width: 16px;
      background-color: white;
      border: 1px solid black;
      border-radius: 50%;
      display: inline-block;
      z-index: 2;
      position: relative;
    }

    .concordium-Rtable--3cols > .concordium-Rtable-cell {
      width: 33.33%;
    }

    .concordium-Rtable {
      position: relative; 
    }

    .concordium-Rtable-cell .concordium-text {
      color: rgba(13, 18, 28, 0.70);
      text-align: center;
      font-size: 11px;
      font-style: normal;
      font-weight: 500;
      line-height: 120%; 
    }

    .concordium-Rtable-cell .concordium-text.active {
      color: #0D121C;
      text-align: center;
      font-size: 11px;
      font-style: normal;
      font-weight: 700;
      line-height: 120%; 
    }

    .concordium-line-no-fill {
      width: 100%;
      height: 1px;
      display: block;
      position: relative;
      background: rgba(10, 12, 30, 0.2);
      top: -15px;
      left: 50%;
      margin: 0 auto;
    }

    .concordium-hr-line {
      margin: 16px 0;
    }

    #${PopupConstants.ELEMENT_IDS.qrContainer} {
      display: flex;
      justify-content: center;
      margin: 1.0rem 0;
    }
  `;
        document.head.appendChild(style);
    }

    /**
     * Closes the popup and removes styles
     */
    static closePopup(): void {
        const wrapper = document.getElementById(PopupConstants.ELEMENT_IDS.popupWrapper);
        if (wrapper) wrapper.remove();

        const style = document.getElementById(PopupConstants.ELEMENT_IDS.popupStyles);
        if (style) style.remove();
    }

    /**
     * Opens the ID App using a deep link
     * Handles both mobile and desktop scenarios
     * @param wallectConnectMobileUrl - The mobile deep link URL
     * @param walletConnectDesktopUrl - Optional desktop URL
     */
    static openIdapp({
        wallectConnectMobileUrl,
        walletConnectDesktopUrl,
    }: {
        wallectConnectMobileUrl: string;
        walletConnectDesktopUrl?: string;
    }): void {
        // On mobile, hand off to the native app
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.location.href = wallectConnectMobileUrl;
        } else {
            // Desktop fallback: show instructions or open a popup for testing
            if (walletConnectDesktopUrl) {
                const width = 400;
                const height = 700;
                const top = 0;
                const left = window.screen.availWidth - width;
                window.open(
                    walletConnectDesktopUrl,
                    'ConcordiumIdapp',
                    `width=${width},height=${height},top=${top},left=${left}`
                );
            }
        }
    }

    /**
     * Loads the QR Code library from CDN
     * @returns Promise that resolves when library is loaded
     */
    private static loadQRCodeLibrary(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if ((window as any).QRCode) {
                resolve();
                return;
            }

            // Check if script tag already exists
            if (document.getElementById(PopupConstants.ELEMENT_IDS.qrcodeLib)) {
                // Wait for it to load
                const checkInterval = setInterval(() => {
                    if ((window as any).QRCode) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                return;
            }

            // Create and load script
            const script = document.createElement('script');
            script.id = PopupConstants.ELEMENT_IDS.qrcodeLib;
            script.src = PopupConstants.CLOUDFLARE_CDN_FOR_QRCODE;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load QR Code library'));
            document.head.appendChild(script);
        });
    }

    /**
     * Renders a QR code in the specified container
     * @param url - The URL to encode in the QR code
     */
    private static async renderQRCode(url: string): Promise<void> {
        await this.loadQRCodeLibrary();

        const qrContainer = document.getElementById(PopupConstants.ELEMENT_IDS.qrContainer);
        if (qrContainer && (window as any).QRCode) {
            // Clear existing QR code
            qrContainer.innerHTML = '';

            // Create new QR code
            new (window as any).QRCode(qrContainer, {
                text: url,
                width: PopupConstants.QR_CONFIG.width,
                height: PopupConstants.QR_CONFIG.height,
                colorDark: PopupConstants.QR_CONFIG.colorDark,
                colorLight: PopupConstants.QR_CONFIG.colorLight,
                correctLevel: (window as any).QRCode.CorrectLevel.H,
            });
        }
    }

    /**
     * Shows a popup with WalletConnect QR code and deep link
     * @param options - Popup configuration options
     */
    static async showWalletConnectPopup(options: PopupOptions): Promise<void> {
        if (!navigator || !window) {
            throw new Error('ConcordiumIDAppPopup.showWalletConnectPopup() requires a browser environment');
        }

        if (!options.walletConnectUri) {
            throw new Error('ConcordiumIDAppPopup.showWalletConnectPopup() requires a valid walletConnectUri');
        }

        // Remove any existing popup
        this.closePopup();

        this.injectPopupStyles();

        const wallectConnectMobileUrl = `${PopupConstants.IDAPP_HOSTS.mobile}wallet-connect?encodedUri=${options.walletConnectUri}`;
        // const walletConnectDesktopUrl = `${PopupConstants.IDAPP_HOSTS.web}wallet-connect?encodedUri=${options.walletConnectUri}`;

        const wrapper = document.createElement('div');
        wrapper.id = PopupConstants.ELEMENT_IDS.popupWrapper;
        wrapper.innerHTML = `
    <div class="concordium-sdk-popup-overlay">
      <div class="concordium-sdk-popup-box">
        <div class="concordium-app-message">
          <button class="concordium-sdk-close-btn" aria-label="Close">&times;</button>
          
          <div class="concordium-sdk-step">
            <img src="${concordiumLogo}" class="concordium-sdk-logo" alt="Concordium Logo">

            <div class="concordium-Rtable concordium-Rtable--3cols mb-5 w-100">
              <div class="concordium-Rtable-cell" style="order: 0;">
                <span class="concordium-dot"></span>
                <span class="concordium-line-no-fill"></span>
              </div>
              <div class="concordium-Rtable-cell" style="order: 1;">
                <div class="concordium-text active">
                  Connect / <br> Pair Apps 
                </div>
              </div>
              <div class="concordium-Rtable-cell" style="order: 0;">
                <span class="concordium-dot-no-fill"></span>
                <span class="concordium-line-no-fill"></span>
              </div>
              <div class="concordium-Rtable-cell" style="order: 1;">
                <div class="concordium-text">
                  Complete ID <br>Verification
                </div>
              </div>
              <div class="concordium-Rtable-cell" style="order: 0;">
                <span class="concordium-dot-no-fill"></span>
              </div>
              <div class="concordium-Rtable-cell" style="order: 1;">
                <div class="concordium-text">
                  Create <br> Account
                </div>
              </div>
            </div>

            <div class="concordium-hr-line"><hr></div>
            
            <p class="concordium-sdk-copy">
              Please follow and complete the <br> account setup in Concordium ID App.
            </p>
            
            <div id="${PopupConstants.ELEMENT_IDS.qrContainer}"></div>
            
            <div class="concordium-sdk-btns">
              <button id="${PopupConstants.ELEMENT_IDS.openAppBtn}" class="concordium-sdk-btn concordium-sdk-btn--primary">
                Open Concordium ID App
              </button>
            </div>
          </div>
        </div>
        
        <div class="concordium-no-app-msg">
          <p class="concordium-sdk-install">
            If you don't have Concordium ID App, install it then return here to continue.
          </p>
          <div class="concordium-sdk-store-links">
            <a href="${PopupConstants.APP_STORE_LINKS.ios}" target="_blank" rel="noopener noreferrer">
              <img src="${appStoreLogo}" alt="Download on the App Store">
            </a>
            <a href="${PopupConstants.APP_STORE_LINKS.android}" target="_blank" rel="noopener noreferrer">
              <img src="${playStoreLogo}" alt="Get it on Google Play">
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

        document.body.appendChild(wrapper);

        // Render QR code
        await this.renderQRCode(wallectConnectMobileUrl);

        // Setup event listeners
        const openAppBtn = wrapper.querySelector<HTMLButtonElement>(`#${PopupConstants.ELEMENT_IDS.openAppBtn}`)!;
        const closeBtn = wrapper.querySelector<HTMLButtonElement>('.concordium-sdk-close-btn')!;

        closeBtn.addEventListener('click', () => {
            this.closePopup();
            options.onClose?.();
        });

        openAppBtn?.addEventListener('click', () => {
            try {
                this.openIdapp({ wallectConnectMobileUrl });
            } catch (e) {
                console.error('Failed to open ID App:', e);
            }
        });
    }

    /**
     * Shows a popup for account creation actions
     * @param options - Popup configuration options
     */
    static async showAccountActionsPopup(options: PopupOptions): Promise<void> {
        if (!options.onCreateAccount) {
            throw new Error('onCreateAccount handler must be provided');
        }

        if (!options.walletConnectSessionTopic) {
            throw new Error("Wallet Connect's session.topic is required");
        }

        // Remove any existing popup
        this.closePopup();

        this.injectPopupStyles();

        const wrapper = document.createElement('div');
        wrapper.id = PopupConstants.ELEMENT_IDS.popupWrapper;
        wrapper.innerHTML = `
    <div class="concordium-sdk-popup-overlay">
      <div class="concordium-sdk-popup-box">
        <div class="concordium-app-message">
          <button class="concordium-sdk-close-btn" aria-label="Close">&times;</button>

          <div class="concordium-sdk-step">
            <img src="${concordiumLogo}" class="concordium-sdk-logo" alt="Concordium Logo">
            
            <div class="create__wrap">
              <div class="concordium-Rtable concordium-Rtable--3cols mb-5 w-100">
                <div class="concordium-Rtable-cell" style="order: 0;">
                  <span class="concordium-dot"></span>
                  <span class="concordium-line-no-fill"></span>
                </div>
                <div class="concordium-Rtable-cell" style="order: 1;">
                  <div class="concordium-text active">
                    Connect / <br> Pair Apps 
                  </div>
                </div>
                <div class="concordium-Rtable-cell" style="order: 0;">
                  <span class="concordium-dot"></span>
                  <span class="concordium-line-no-fill"></span>
                </div>
                <div class="concordium-Rtable-cell" style="order: 1;">
                  <div class="concordium-text active">
                    Complete ID <br>Verification
                  </div>
                </div>
                <div class="concordium-Rtable-cell" style="order: 0;">
                  <span class="concordium-dot-no-fill"></span>
                </div>
                <div class="concordium-Rtable-cell" style="order: 1;">
                  <div class="concordium-text">
                    Create <br> Account
                  </div>
                </div>
              </div>
              <div class="concordium-hr-line"><hr></div>
            </div>
            
            <p class="concordium-sdk-copy">
              Only once you've completed the ID Verification, choose your next step.
            </p>

            <div class="concordium-sdk-btns">
              <button id="${PopupConstants.ELEMENT_IDS.createAccountBtn}" class="concordium-sdk-btn concordium-sdk-btn--primary">
                Create New Account
              </button>
            </div>
          </div>
        </div>
        
        <div class="concordium-no-app-msg">
          <p class="concordium-sdk-install">
            To Create an Account, match the code below in the Concordium ID App
          </p>
          <div class="concordium-authCode" id="${PopupConstants.ELEMENT_IDS.sessionTopic}">
            ${options.walletConnectSessionTopic.substr(0, 4).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  `;

        document.body.appendChild(wrapper);

        // Setup event listeners
        const closeBtn = wrapper.querySelector<HTMLButtonElement>('.concordium-sdk-close-btn')!;
        closeBtn.addEventListener('click', () => {
            this.closePopup();
            options.onClose?.();
        });

        // Setup create account button
        requestAnimationFrame(() => {
            const createBtn = wrapper.querySelector<HTMLButtonElement>(
                `#${PopupConstants.ELEMENT_IDS.createAccountBtn}`
            );
            if (options.onCreateAccount && createBtn) {
                createBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    createBtn.disabled = true;
                    createBtn.textContent = '⏳ Please wait...';
                    try {
                        await options.onCreateAccount!();
                    } catch (err) {
                        console.error('Account creation failed:', err);
                        createBtn.textContent = 'Create New Account';
                        createBtn.disabled = false;
                    }
                });
            }
        });
    }
}
