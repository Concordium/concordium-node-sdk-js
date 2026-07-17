
All credential material is derived from the wallet **seed phrase**. There
is no API that extracts it from a running wallet (browser, mobile, or
desktop) — you reconstruct it from the seed. This is by design and is what
keeps the identity layer private.

If a guide asks you to "construct an `IdentityInput`" and you have only a
seed phrase, this page is what you are looking for.

## Which path do I need?

**1. Do you control the seed phrase for the identity?**

- **No — it is an end user's identity and you want to act for them.** Not
    possible, and you should not try. Never ask a user for their seed
    phrase. Have them sign in their own wallet instead.
- **Yes — you own the seed (you are building the wallet).** Continue.

**2. What are you creating?**

- **A brand new account** under the identity → use
    `createCredentialTransaction`. This is a credential *deployment* and
    creates a new account address. See
    [Account Creation](./account-creation.md).
- **An extra credential on an *existing* account address** → use
    `createUnsignedCredentialForExistingAccount`, which needs an
    `IdentityInput`. Continue below.

## Construct `IdentityInput` from a seed phrase

`IdentityInput` bundles the identity object, the identity provider info,
and the three private values derived from the seed. All three are the
same `HexString` the SDK derives internally, so you build them straight
from `ConcordiumHdWallet`:

```ts
import { ConcordiumHdWallet, IdentityInput } from '@concordium/web-sdk';

const wallet = ConcordiumHdWallet.fromSeedPhrase(seedPhrase, net);

const identityInput: IdentityInput = {
    identityObject,                        // see "Recover the identity object" below
    identityProvider: { ipInfo, arsInfos },
    idCredSecret: wallet.getIdCredSec(ipIndex, identityIndex).toString('hex'),
    prfKey: wallet.getPrfKey(ipIndex, identityIndex).toString('hex'),
    randomness: wallet
        .getSignatureBlindingRandomness(ipIndex, identityIndex)
        .toString('hex'),
};
```

Where the public inputs come from:

- `ipInfo` — `getIdentityProviders()`, pick your provider.
- `arsInfos` — `getAnonymityRevokers()`.
- `ipIndex` — `ipInfo.ipIdentity`.

> If instead you have a mobile wallet export or a user-cli `id-use-data`
> file (not a seed), construct `IdentityInput` from those as shown in
> [Old GRPC-Client](./grpc-v1.md#construct-identityinput-for-creating-credentials).

Pass this `identityInput` to `createUnsignedCredentialForExistingAccount`,
then submit it in an update-credentials transaction. See
[Transactions](../transactions.md#create-a-credential-for-an-existing-account).

## Recover the identity object

Don't have `identityObject` stored? Recover it from the seed via the
identity provider's `recoveryStart` endpoint:

```ts
import { ConcordiumHdWallet, createIdentityRecoveryRequest } from '@concordium/web-sdk';

const idp = (await client.getIdentityProviders())[ipIndex]; // has metadata.recoveryStart
const globalContext = await client.getCryptographicParameters();

const request = createIdentityRecoveryRequest({
    ipInfo: idp.ipInfo,
    globalContext,
    seedAsHex: ConcordiumHdWallet.fromSeedPhrase(seedPhrase, net).seedAsHex,
    net,
    identityIndex,
    timestamp: Math.floor(Date.now() / 1000),
});

// GET recoveryStart?state={"idRecoveryRequest": <request>}, then fetch the
// returned URL. The response's `.value` is the identityObject.
const params = new URLSearchParams({
    state: JSON.stringify({ idRecoveryRequest: request }),
});
const resolved = await fetch(`${idp.metadata.recoveryStart}?${params}`);
const identityObject = (await (await fetch(resolved.url)).json()).value;
```

If your secret is held separately, use
`createIdentityRecoveryRequestWithKeys({ idCredSec, ipInfo, globalContext, timestamp })`.

## FAQ

**"I can't extract or reconstruct `IdentityInput` from my web wallet."**
You reconstruct it from your seed phrase, not from the running wallet —
see [above](#construct-identityinput-from-a-seed-phrase). The wallet never
exposes these secrets through an API, by design.

**"Can I add a credential to a user's account without their seed?"** No.
The material is seed-derived and the wallet does not expose it. The user
must sign in their own wallet.

## Term mapping

| Older term / gap | Use now |
| --- | --- |
| "Construct `IdentityInput`" (was a TODO) | Derive from the seed, as above |
| `createCredentialDeploymentPayload` (deprecated) | `createCredentialTransaction` |
