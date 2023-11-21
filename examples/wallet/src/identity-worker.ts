import { IdentityRequestInput, createIdentityRequest } from "@concordium/web-sdk";

self.onmessage = (e: MessageEvent<IdentityRequestInput>) => {
    const identityRequest = createIdentityRequest(e.data);
    self.postMessage(identityRequest);
};
