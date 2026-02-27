export interface WalletConnectSession {
  topic: string;
  namespaces: Record<string, any>;
  expiry: number;
  acknowledged: boolean;
}
