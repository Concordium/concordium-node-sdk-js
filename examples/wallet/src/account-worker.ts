import { createCredentialPayloadNoSeed } from '@concordium/web-sdk';

import { AccountWorkerInput } from './types';

self.onmessage = (e: MessageEvent<AccountWorkerInput>) => {
    const credentialTransaction = createCredentialPayloadNoSeed(e.data.credentialInput, e.data.expiry);
    self.postMessage(credentialTransaction);
};
