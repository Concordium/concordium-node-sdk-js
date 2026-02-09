import { setConfig, getConfig } from '@/config.state';
import { ModalConstants } from '@/constants/modal.constants';
import { ServiceFactory } from '@/services';
import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import type {
  SDKWalletConnectConfig,
  SessionApprovedEvent,
  PresentationRequest,
  PresentationResponse,
} from '@/types';

/**
 * Main SDK class for Concordium Verification WebUI
 * Provides a unified interface for wallet connection and ZKP verification
 *
 * Event-driven architecture:
 * 1. SDK emits 'session_approved' when WalletConnect session is established
 * 2. Merchant creates presentation request and calls sendPresentationRequest()
 * 3. SDK emits 'presentation_received' with the ZKP response
 * 4. Merchant verifies the response and calls showSuccessState()
 */
export class ConcordiumVerificationWebUI {
  private currentSession: SessionApprovedEvent | null = null;
  private _mode?: 'sdk-managed' | 'merchant-provided';
  private _wcUri?: string;
  private _wcConfig?: SDKWalletConnectConfig;

  /**
   * Shows the landing modal
   */
  static async showLandingModal(): Promise<void> {
    const { showLandingModal } = await import('./components/desktop/landing');
    showLandingModal();
  }

  /**
   * Shows the returning user modal
   */
  static async showReturningUserModal(): Promise<void> {
    const { showReturningUserModal } =
      await import('./components/desktop/returning-user');
    showReturningUserModal();
  }

  /**
   * Shows the scan modal
   */
  static async showScanModal(): Promise<void> {
    const { showScanModal } = await import('./components/desktop/scan');
    showScanModal();
  }

  /**
   * Shows the processing modal
   */
  static async showProcessingModal(): Promise<void> {
    const { showProcessingModal } =
      await import('./components/desktop/processing');
    showProcessingModal();
  }

  /**
   * Closes any existing modal and cleans up
   */
  static closeModal(): void {
    const existingModal = document.querySelector(
      '.mobile--modal-overlay, .desktop--modal-overlay'
    );
    if (existingModal) {
      existingModal.remove();
    }
  }

  /**
   * Initialize the Verification WebUI
   * @param config - Configuration options for the SDK
   * @example
   * ```typescript
   * // SDK-managed mode: SDK handles WalletConnect with projectId
   * const sdk = new ConcordiumVerificationWebUI({
   *   network: 'testnet',
   *   projectId: 'YOUR_PROJECT_ID',
   *   metadata: {
   *     name: 'My App',
   *     description: 'My app description',
   *     url: 'https://myapp.com',
   *     icons: ['https://myapp.com/icon.png']
   *   }
   * });
   *
   * // Merchant-provided mode: Merchant provides WalletConnect URI
   * // (supports both walletConnectURI and walletConnectUri)
   * const sdk = new ConcordiumVerificationWebUI({
   *   network: 'testnet',
   *   walletConnectUri: 'wc:...',
   * });
   *
   * // Then call renderUIModals to show the connection flow
   * await sdk.renderUIModals();
   * ```
   */
  constructor(config?: Record<string, any>) {
    // Set global config first
    if (config) {
      setConfig(config as any);

      // Extract projectId and metadata from either top-level or nested walletConnect
      const projectId =
        (config as any).projectId || (config as any).walletConnect?.projectId;
      const metadata =
        (config as any).metadata || (config as any).walletConnect?.metadata;
      // Support both walletConnectURI and walletConnectUri for better DX
      const walletConnectURI =
        (config as any).walletConnectURI || (config as any).walletConnectUri;

      // Store configuration based on mode
      if (walletConnectURI) {
        // Merchant-provided mode
        this._mode = 'merchant-provided';
        this._wcUri = walletConnectURI;
      } else if (projectId) {
        // SDK-managed mode
        this._mode = 'sdk-managed';
        this._wcConfig = { projectId, metadata };
      }
    }
  }

  /**
   * Render the WalletConnect UI modals
   * Automatically detects mode based on constructor config:
   * - If walletConnectURI provided: merchant-provided mode
   * - If projectId provided: SDK-managed mode
   * - If active session exists: shows returning user modal
   * - If no config: shows landing modal (merchant can set URI later via setWalletConnectUri)
   *
   * NOTE: For merchant-managed WalletConnect with active sessions,
   * you can skip renderUIModals() and use showModal('processing') directly
   * @param onClose - Optional callback when modal is closed
   * @example
   * ```typescript
   * // SDK-managed mode (new connection)
   * const sdk = new ConcordiumVerificationWebUI({
   *   network: 'testnet',
   *   projectId: 'YOUR_PROJECT_ID',
   *   metadata: { ... }
   * });
   * await sdk.renderUIModals(); // SDK generates QR code
   *
   * // Merchant-provided mode (new connection)
   * const sdk = new ConcordiumVerificationWebUI({
   *   network: 'testnet',
   *   walletConnectUri: 'wc:...'
   * });
   * await sdk.renderUIModals(); // Uses merchant's URI
   *
   * // Merchant-managed WalletConnect (URI set later)
   * const sdk = new ConcordiumVerificationWebUI({ network: 'testnet' });
   * await sdk.renderUIModals(); // Shows landing modal
   * // Later, when you have the URI:
   * sdk.setWalletConnectUri('wc:...');
   *
   * // Merchant-managed WalletConnect with active session
   * const sdk = new ConcordiumVerificationWebUI({ network: 'testnet' });
   * await sdk.showModal('processing');
   * await sdk.sendPresentationRequest(request, yourSessionTopic);
   * ```
   */
  async renderUIModals(onClose?: () => void): Promise<void> {
    const mode = this._mode;
    const wcConfig = this._wcConfig;
    const wcUri = this._wcUri;

    // Check if we have configuration for NEW connections
    if (mode === 'merchant-provided' && wcUri) {
      // Merchant-provided URI mode - merchant will provide URI for new connection
      // Also check for SDK-managed active sessions
      try {
        const wcService = ServiceFactory.getWalletConnectService();
        if (wcService) {
          await wcService.initialize();
          const activeSessions = wcService.getActiveSessions();

          if (activeSessions.length > 0) {
            console.log('✓ Active SDK-managed session detected');
            await ConcordiumVerificationWebUI.showReturningUserModal();

            if (onClose) {
              this.setupCloseCallback(onClose);
            }
            return;
          }
        }
      } catch (error) {
        // No SDK-managed session, continue with merchant-provided flow
      }

      await this.showWalletConnectPopup(wcUri, onClose);
    } else if (mode === 'sdk-managed' && wcConfig?.projectId) {
      // SDK-managed mode with projectId - check for active sessions first
      try {
        const wcService = ServiceFactory.getWalletConnectService();
        if (wcService) {
          await wcService.initialize();
          const activeSessions = wcService.getActiveSessions();

          if (activeSessions.length > 0) {
            console.log('✓ Active SDK-managed session detected');
            await ConcordiumVerificationWebUI.showReturningUserModal();

            if (onClose) {
              this.setupCloseCallback(onClose);
            }
            return;
          }
        }
      } catch (error) {
        // No active session, continue with new connection
      }

      // No active session, start new connection
      await this.initWalletConnect(
        {
          projectId: wcConfig.projectId,
          metadata: wcConfig.metadata,
        },
        onClose
      );
    } else {
      // No config provided - just show landing modal
      // Merchant can provide URI later via setWalletConnectUri()
      console.log(' Merchant-Managed WalletConnect Mode');
      console.log('   → Showing landing modal');
      console.log('   → Use setWalletConnectUri() to provide URI when ready');

      // Set merchant-provided mode (URI will be provided later)
      localStorage.setItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTION_MODE,
        'merchant-provided'
      );

      await ConcordiumVerificationWebUI.showLandingModal();

      if (onClose) {
        this.setupCloseCallback(onClose);
      }
    }
  }

  /**
   * Show WalletConnect popup with URI validation
   * This is the main entry point for merchant integrations
   * @param walletConnectUri - The WalletConnect URI to validate and use
   * @param onClose - Optional callback when modal is closed
   */
  async showWalletConnectPopup(
    walletConnectUri: string,
    onClose?: () => void
  ): Promise<void> {
    if (!walletConnectUri) {
      console.warn('No WalletConnect URI provided to showWalletConnectPopup');
      throw new Error('WalletConnect URI is required');
    }

    // Validate WalletConnect URI format
    if (!walletConnectUri.startsWith('wc:')) {
      console.warn('Invalid WalletConnect URI format:', walletConnectUri);
      throw new Error(
        'Invalid WalletConnect URI format. Must start with "wc:"'
      );
    }

    try {
      console.log(' Merchant-Provided WalletConnect Mode');
      console.log(
        '   → Using merchant-provided URI:',
        walletConnectUri.substring(0, 20) + '...'
      );

      // Store the URI for use in modals
      this.storeWalletConnectUri(walletConnectUri);

      // Mark as merchant-provided mode
      localStorage.setItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTION_MODE,
        'merchant-provided'
      );

      // Show the landing modal
      await ConcordiumVerificationWebUI.showLandingModal();

      // Set up close callback if provided
      if (onClose) {
        this.setupCloseCallback(onClose);
      }
    } catch (error) {
      console.error('Failed to show WalletConnect popup:', error);
      throw error;
    }
  }

  /**
   * Initialize WalletConnect with project ID
   * SDK will handle WalletConnect initialization and QR code generation
   * Note: Network must be set in ConcordiumVerificationWebUI constructor
   * @param config - SDK WalletConnect configuration with projectId
   * @param onClose - Optional callback when modal is closed
   * @example
   * ```typescript
   * const sdk = new ConcordiumVerificationWebUI({ network: 'testnet' });
   * await sdk.initWalletConnect({
   *   projectId: 'your-project-id',
   *   metadata: {
   *     name: 'My Merchant App',
   *     description: 'My merchant application',
   *     url: 'https://myapp.com',
   *     icons: ['https://myapp.com/icon.png']
   *   }
   * });
   * ```
   */
  async initWalletConnect(
    config: SDKWalletConnectConfig,
    onClose?: () => void
  ): Promise<void> {
    if (!config.projectId) {
      throw new Error('Project ID is required for SDK-managed WalletConnect');
    }

    // Get network from global config (set in constructor)
    const globalConfig = getConfig();
    const network = globalConfig.network || 'testnet';

    if (!network) {
      throw new Error(
        'Network (mainnet or testnet) must be set in ConcordiumVerificationWebUI constructor'
      );
    }

    try {
      console.log(' SDK-Managed WalletConnect Mode');
      console.log('   → SDK will handle WalletConnect initialization');
      console.log(
        '   → Project ID:',
        config.projectId.substring(0, 20) + '...'
      );
      console.log('   → SDK will generate QR code automatically');

      // Reset any existing WalletConnect service to ensure clean state
      const { ServiceFactory } = await import('./services/service.factory');
      ServiceFactory.resetServices();

      // Store configuration for use in modals
      localStorage.setItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.SDK_PROJECT_ID,
        config.projectId
      );
      localStorage.setItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK,
        network
      );
      localStorage.setItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTION_MODE,
        'sdk-managed'
      );

      // Store metadata if provided
      if (config.metadata) {
        localStorage.setItem(
          'sdkWalletConnectMetadata',
          JSON.stringify(config.metadata)
        );
      }

      // Show the landing modal
      await ConcordiumVerificationWebUI.showLandingModal();

      // Set up close callback if provided
      if (onClose) {
        this.setupCloseCallback(onClose);
      }
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      throw error;
    }
  }

  /**
   * Store WalletConnect URI for modal components to access
   * @param uri - WalletConnect URI to store
   */
  private storeWalletConnectUri(uri: string): void {
    try {
      localStorage.setItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.WALLET_CONNECT_URI,
        uri
      );
    } catch (error) {
      console.error('Failed to store WalletConnect URI:', error);
    }
  }

  /**
   * Set up close callback for modal
   * @param onClose - Callback function to execute when modal closes
   */
  private setupCloseCallback(onClose: () => void): void {
    // Listen for modal close events
    const handleModalClose = () => {
      onClose();
      document.removeEventListener('concordium-modal-closed', handleModalClose);
    };

    document.addEventListener('concordium-modal-closed', handleModalClose);
  }

  /**
   * Show the appropriate modal based on screen size
   * @param modalType - Type of modal to show ('landing', 'scan', 'processing', 'returning-user')
   */
  async showModal(
    modalType: 'landing' | 'scan' | 'processing' | 'returning-user' = 'landing'
  ): Promise<void> {
    switch (modalType) {
      case 'landing':
        await ConcordiumVerificationWebUI.showLandingModal();
        break;
      case 'scan':
        await ConcordiumVerificationWebUI.showScanModal();
        break;
      case 'processing':
        await ConcordiumVerificationWebUI.showProcessingModal();
        break;
      case 'returning-user':
        await ConcordiumVerificationWebUI.showReturningUserModal();
        break;
      default:
        console.warn('Unknown modal type:', modalType);
    }
  }

  /**
   * Close any open modal
   */
  closeModal(): void {
    ConcordiumVerificationWebUI.closeModal();
  }

  /**
   * Handle session approval and transition to processing modal
   * Call this when a WalletConnect session is approved after scanning QR code
   * @param sessionData - The session data from WalletConnect approval
   * @example
   * ```typescript
   * const sdk = new ConcordiumVerificationWebUI();
   * await sdk.handleSessionApproval({
   *   session: walletConnectSession,
   *   accounts: session.namespaces?.ccd?.accounts || []
   * });
   * ```
   */
  async handleSessionApproval(sessionData: any): Promise<void> {
    const { handleSessionApproval } = await import('./components/desktop/scan');
    await handleSessionApproval(sessionData);
  }

  /**
   * Show success state in processing modal
   * Call this when verification is completed successfully
   * @example
   * ```typescript
   * const sdk = new ConcordiumVerificationWebUI();
   * await sdk.showSuccessState();
   * ```
   */
  async showSuccessState(): Promise<void> {
    const { showSuccessState } =
      await import('./components/desktop/processing');
    await showSuccessState();
  }

  /**
   * Set WalletConnect URI for merchant-provided mode
   * Use this when you want to provide the URI after SDK initialization
   * @param walletConnectUri - The WalletConnect URI
   * @example
   * ```typescript
   * const sdk = new ConcordiumVerificationWebUI({ network: 'testnet' });
   *
   * // Generate your WalletConnect URI
   * const uri = await yourWalletConnectClient.connect();
   *
   * // Set it in SDK
   * sdk.setWalletConnectUri(uri);
   *
   * // Now render UI
   * await sdk.renderUIModals();
   * ```
   */
  setWalletConnectUri(walletConnectUri: string): void {
    if (!walletConnectUri || !walletConnectUri.startsWith('wc:')) {
      throw new Error(
        'Invalid WalletConnect URI format. Must start with "wc:"'
      );
    }

    this._mode = 'merchant-provided';
    this._wcUri = walletConnectUri;

    // Store for use in modals
    this.storeWalletConnectUri(walletConnectUri);
    localStorage.setItem(
      ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTION_MODE,
      'merchant-provided'
    );
  }

  /**
   * Update the merchant-provided WalletConnect URI (for QR code refresh)
   * Use this when your merchant-generated QR code expires and you need to provide a new one
   * @param newUri - The new WalletConnect URI
   * @example
   * ```typescript
   * const sdk = new ConcordiumVerificationWebUI();
   * // When your QR code expires, generate a new one and update:
   * await sdk.updateWalletConnectUri(newWalletConnectUri);
   * ```
   */
  async updateWalletConnectUri(newUri: string): Promise<void> {
    if (!newUri) {
      throw new Error('WalletConnect URI is required');
    }

    // Validate WalletConnect URI format
    if (!newUri.startsWith('wc:')) {
      throw new Error(
        'Invalid WalletConnect URI format. Must start with "wc:"'
      );
    }

    const connectionMode = localStorage.getItem(
      ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTION_MODE
    );
    if (connectionMode === 'sdk-managed') {
      throw new Error(
        'updateWalletConnectUri() is only for merchant-provided mode. In SDK-managed mode, QR codes auto-refresh.'
      );
    }

    try {
      // Store the new URI
      this.storeWalletConnectUri(newUri);

      // Use desktop scan modal for both mobile and desktop
      const { updateQRCodeFromMerchant } =
        await import('./components/desktop/scan');
      await updateQRCodeFromMerchant(newUri);
    } catch (error) {
      console.error('Failed to update WalletConnect URI:', error);
      throw error;
    }
  }

  /**
   * Close the processing modal
   * Call this to programmatically close the processing modal from Vue
   * @example
   * ```typescript
   * const sdk = new ConcordiumVerificationWebUI();
   * await sdk.closeProcessingModal();
   * ```
   */
  async closeProcessingModal(): Promise<void> {
    const { hideProcessingModal } =
      await import('./components/desktop/processing');
    hideProcessingModal();
  }

  /**
   * Send a presentation request (ZKP request) through the current WalletConnect session
   * Call this after receiving 'session_approved' event with your presentation request
   * @param presentationRequest - The presentation request object to send to the wallet
   * @param sessionTopic - Optional session topic (uses current session if not provided)
   * @returns Promise that resolves when request is sent
   * @example
   * ```typescript
   * const sdk = new ConcordiumVerificationWebUI();
   *
   * // Listen for session approval
   * window.addEventListener('concordium-verification-event', async (event) => {
   *   if (event.detail.type === 'session_approved') {
   *     // Create your presentation request
   *     const presentationRequest = {
   *       challenge: 'your-challenge-here',
   *       credentialSubject: {
   *         attributes: ['age'],
   *         threshold: 18
   *       }
   *     };
   *
   *     // Send through SDK
   *     await sdk.sendPresentationRequest(presentationRequest);
   *   }
   * });
   * ```
   */
  async sendPresentationRequest(
    presentationRequest: PresentationRequest,
    sessionTopic?: string
  ): Promise<void> {
    const topic = sessionTopic || this.currentSession?.topic;

    if (!topic) {
      throw new Error('No active WalletConnect session. Please connect first.');
    }

    try {
      const wcService = ServiceFactory.getWalletConnectService();
      if (!wcService) {
        throw new Error('WalletConnect service not initialized');
      }

      // Get the network configuration
      const globalConfig = getConfig();
      const network = globalConfig.network || 'testnet';
      const chainId =
        network === 'mainnet'
          ? import.meta.env.VITE_CHAIN_ID_MAINNET
          : import.meta.env.VITE_CHAIN_ID_TESTNET;

      // Get metadata from constructor config or use defaults
      const wcConfig = this._wcConfig;
      const constructorMetadata = wcConfig?.metadata || globalConfig.metadata;

      const metadata = {
        description:
          constructorMetadata?.description || 'Requesting verification',
        appName: constructorMetadata?.name || 'Concordium Verification WebUI',
        url: constructorMetadata?.url || window.location.origin,
        icons: constructorMetadata?.icons || [concordiumModalLogo],
      };

      // Send the request through WalletConnect
      const response = await wcService.request({
        topic,
        chainId,
        request: {
          method: 'request_verifiable_presentation_v1',
          params: {
            ...(presentationRequest || {}),
            metadata,
          },
        },
      });

      // Emit the response back to merchant
      this.emitEvent('presentation_received', response as PresentationResponse);
    } catch (error) {
      console.error('Failed to send presentation request:', error);
      this.emitEvent('error', {
        message: 'Failed to send presentation request',
        error,
      });
      throw error;
    }
  }

  /**
   * Send a request to an existing WalletConnect session and show processing modal
   * Use this when you already have an established session and want to send a new request
   * @param presentationRequest - The presentation request to send
   * @param sessionTopic - The session topic to use
   * @example
   * ```typescript
   * const sdk = new ConcordiumVerificationWebUI();
   * await sdk.sendRequestToExistingSession(presentationRequest, sessionTopic);
   * ```
   */
  async sendRequestToExistingSession(
    presentationRequest: PresentationRequest,
    sessionTopic: string
  ): Promise<void> {
    // Show processing modal
    await ConcordiumVerificationWebUI.showProcessingModal();

    try {
      // Send the request
      await this.sendPresentationRequest(presentationRequest, sessionTopic);
    } catch (error) {
      console.error('Failed to send request to existing session:', error);
      throw error;
    }
  }

  /**
   * Store the current session after approval
   * This is called internally when a session is approved
   * @internal
   */
  setCurrentSession(session: SessionApprovedEvent): void {
    this.currentSession = session;
  }

  /**
   * Get the current active session
   * @returns The current session or null if no session is active
   */
  getCurrentSession(): SessionApprovedEvent | null {
    return this.currentSession;
  }

  /**
   * Emit an SDK event to the merchant application
   * @internal
   */
  private emitEvent(type: string, data: any): void {
    const event = new CustomEvent('concordium-merchant-sdk-event', {
      detail: { type, data },
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);

    console.log(`SDK Event emitted: ${type}`, data);
  }
}

// Export a singleton instance for convenience
export const sdk = new ConcordiumVerificationWebUI();

// Default export
export default ConcordiumVerificationWebUI;
