import {
    createIdentityRecoveryRequest,
    IdentityRecoveryRequestInput
} from '@concordium/web-sdk';

self.onmessage = (e: MessageEvent<IdentityRecoveryRequestInput>) => {
    const recoveryRequest = createIdentityRecoveryRequest(e.data);
    self.postMessage(recoveryRequest);
};
