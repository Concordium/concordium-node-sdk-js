import { IdentityRequestWithKeysInput, createIdentityRequestWithKeys } from '@concordium/web-sdk';

self.onmessage = (e: MessageEvent<IdentityRequestWithKeysInput>) => {
    const identityRequest = createIdentityRequestWithKeys(e.data);
    self.postMessage(identityRequest);
};
