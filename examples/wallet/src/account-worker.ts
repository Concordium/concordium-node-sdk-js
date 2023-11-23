import { createCredentialTransaction } from '@concordium/web-sdk';
import { AccountWorkerInput } from './types';

self.onmessage = (e: MessageEvent<AccountWorkerInput>) => {
    const credentialTransaction = createCredentialTransaction(
        e.data.credentialInput,
        e.data.expiry
    );
    self.postMessage(credentialTransaction);
};
