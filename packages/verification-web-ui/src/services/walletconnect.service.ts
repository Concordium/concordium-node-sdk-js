// filepath: src/services/walletconnect.service.ts
import { SignClient } from '@walletconnect/sign-client';
import type { SessionTypes, ISignClient } from '@walletconnect/types';
import type { WalletConnectConfig } from '@/types';
import { WalletConnectConstants } from '@/constants';
import { dispatchConcordiumEvent } from '@/index';

export class WalletConnectService {
  private signClient: ISignClient | null = null;
  private config: WalletConnectConfig;
  private currentSession: SessionTypes.Struct | null = null;
  private currentConnectionUri: string | null = null;

  constructor(config: WalletConnectConfig) {
    this.config = config;
  }

  async initialize(): Promise<ISignClient> {
    if (this.signClient) {
      return this.signClient;
    }

    this.validateConfig();

    try {
      this.signClient = await SignClient.init({
        projectId: this.config.projectId,
        metadata: this.config.metadata,
        relayUrl:
          this.config.relayUrl || WalletConnectConstants.DEFAULT_RELAY_URL,
      });

      this.setupEventListeners();
      return this.signClient;
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);

      dispatchConcordiumEvent({
        type: 'error',
        source: 'desktop',
        modalType: 'scan',
        data: { error: this.createInitializationError(error).message },
      });

      throw this.createInitializationError(error);
    }
  }

  async connect(
    namespaces: Record<string, any>
  ): Promise<{ uri: string; approval: () => Promise<SessionTypes.Struct> }> {
    if (!this.signClient) {
      throw new Error(
        'WalletConnect not initialized. Call initialize() first.'
      );
    }

    try {
      const { uri, approval } = await this.signClient.connect({
        requiredNamespaces: namespaces,
      });

      // Store the connection URI
      this.currentConnectionUri = uri || null;

      const enhancedApproval = async (): Promise<SessionTypes.Struct> => {
        try {
          const session = await approval();
          this.currentSession = session;

          dispatchConcordiumEvent({
            type: 'session-approved',
            source: 'desktop',
            modalType: 'scan',
            data: { session },
          });

          return session;
        } catch (error) {
          dispatchConcordiumEvent({
            type: 'session-rejected',
            source: 'desktop',
            modalType: 'scan',
            data: {
              error:
                error instanceof Error ? error.message : 'Session rejected',
            },
          });
          throw error;
        }
      };

      return { uri: uri || '', approval: enhancedApproval };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async request(params: {
    topic: string;
    chainId: string;
    request: {
      method: string;
      params: any;
    };
  }) {
    if (!this.signClient) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      const result = await this.signClient.request(params);

      return result;
    } catch (error) {
      throw error;
    }
  }

  getConnectionUri(): string | null {
    return this.currentConnectionUri;
  }

  async disconnectAll(): Promise<void> {
    if (!this.signClient) return;

    try {
      const sessions = this.signClient.session.getAll();
      const disconnectPromises = sessions.map(session =>
        this.signClient!.disconnect({
          topic: session.topic,
          reason: WalletConnectConstants.DISCONNECT_REASON,
        })
      );

      await Promise.all(disconnectPromises);
      this.currentSession = null;
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    }
  }

  getSignClient(): ISignClient | null {
    return this.signClient;
  }

  getCurrentSession(): SessionTypes.Struct | null {
    return this.currentSession;
  }

  getActiveSessions(): SessionTypes.Struct[] {
    return this.signClient?.session.getAll() || [];
  }

  private setupEventListeners(): void {
    if (!this.signClient) return;

    const signClient = this.signClient as any;

    signClient.on('session_event', (event: any) => {
      dispatchConcordiumEvent({
        type: 'session-event',
        source: 'desktop',
        modalType: 'processing',
        data: { event },
      });
    });

    signClient.on('session_ping', (_event: any) => {
    });

    signClient.on('session_delete', (event: any) => {
      this.currentSession = null;
      dispatchConcordiumEvent({
        type: 'session-deleted',
        source: 'desktop',
        modalType: 'landing',
        data: { topic: event.topic },
      });
    });
  }

  private validateConfig(): void {
    if (!this.config.projectId) {
      throw new Error('WalletConnect projectId is required');
    }

    if (
      this.config.projectId.includes('test') ||
      this.config.projectId.includes('development')
    ) {
      console.warn(
        '🚨 Using test/development project ID. Get a real one from https://cloud.walletconnect.com'
      );
    }
  }

  private createInitializationError(error: unknown): Error {
    if (error instanceof Error && error.message?.includes('projectId')) {
      return new Error(
        'WalletConnect initialization failed. Please ensure you have a valid project ID from https://cloud.walletconnect.com'
      );
    }
    return error instanceof Error
      ? error
      : new Error('Unknown initialization error');
  }
}
