import { IdentityRecoveryRequestWithKeysInput, createIdentityRecoveryRequestWithKeys } from '@concordium/web-sdk';

self.onmessage = (e: MessageEvent<IdentityRecoveryRequestWithKeysInput>) => {
    const recoveryRequest = createIdentityRecoveryRequestWithKeys(e.data);
    self.postMessage(recoveryRequest);
};
