
To create a new account the following is needed:

- `idObject`:
    Identity object for the identity that should be used to create the
    credential
- `ipInfo`:
    The information of the identity provider used for the identity. (See
    `getIdentityProviders`)
- `globalContext`:
    The cryptographic parameters for the block chain (See
    `getCryptographicParameters`)
- `arsInfos`:
    The information of all the anonymity revokers used for the identity (See
    `getAnonymityRevokers`)
- `revealedAttributes`:
    A list of attributes that should be revealed. Note that this can be
    left empty.
- `credNumber`:
    The index of the credential for the identity. This is used to create
    the credential id, and cannot be reused for the same identity.

If you can provide the seedPhrase used for the identity,
use `createCredentialTransaction`, which uses that and the
identity index and network identitfier.  Otherwise you can use
`createCredentialTransactionNoSeed`, which requires the:

- `idCredSec`
- `prfKey`
- Signature retrievel randomness
- Credential public keys
- List of attribute randomness

All of which should be generated from the `seedPhrase`. Note that the
purpose of this alternative is to support cases where the seed phrase is
not directly available.

The credentialDeployment can be signed with the `signCredentialTransaction`
function if the signing key is available, otherwise the digest can be
retrieved by using the `getCredentialDeploymentSignDigest` function.

The following example helps demonstrate how to create a credential deployment
using a seed:

```ts
    const cryptographicParameters = await client.getCryptographicParameters();
    if (!cryptographicParameters) {
        throw new Error('Cryptographic parameters were not found on a block that has been finalized.');
    }
    
    // The identityObject obtained from identity issuance.
    const identityObject = ...
    
    // The attributes to reveal about the account holder on chain. This can be empty
    const revealedAttributes: AttributeKey[] = ['firstName', 'nationality'];
    
    const seedAsHex = 
        'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';
    const net = 'Mainnet'; // use 'Testnet' for the testnet.
    
    // Information about the identity provider (Can be retrieved with getIdentityProviders)
    // Should be the IpInfo for the identityProvider used for the identity
    const ipInfo = ...
    
    // Information about the anonymity revokers (Can be retrieved with getAnonymityRevokers)
    // Should be the information for the revokers used for the identity
    const arsInfos = ...
    
    // The index used for the identity (on the key derivation path);
    const identityIndex = 0;
    // The index for the credential (on the key derivation path), should not be reused for the identity.
    const credNumber = 0;
    
    const inputs = {
            ipInfo,
            globalContext: cryptographicParameters,
            arsInfos,
            idObject: identityObject,
            revealedAttributes,
            seedAsHex,
            net,
            identityIndex,
            credNumber,
    };
    
    const expiry = new TransactionExpiry(new Date(Date.now() + 3600000));
    const credentialDeploymentTransaction: CredentialDeploymentTransaction =
        createCredentialTransaction(
            inputs,
            expiry
        );
    
    // the signing key should be generated from the seed used for the identity and credential details
    const signingKey = ConcordiumHdWallet.fromHex(seedAsHex, net).getAccountSigningKey(ipInfo.ipIdentity, identityIndex, credNumber);
    
    const signatures = await [signCredentialTransaction(credentialDeploymentTransaction, signingKey)];
    
    // The address, that the account created by the transaction will get, can
    // be derived ahead of time.
    const accountAddress: AccountAddress = getAccountAddress(credentialDeploymentTransaction.unsignedCdi.credId);
    
    // Send the transaction to the node
    const success = await client.sendCredentialDeploymentTransaction(
        credentialDeploymentTransaction,
        signatures
    );
    if (success) {
        // The node accepted the transaction. This does not ensure that the transaction
        // will end up in a block, only that the format of the submitted transaction was valid.
    } else {
        // The node rejected the transaction.
    }
    
    // Wait until the account has finalized.
    const transactionHash = getCredentialDeploymentTransactionHash(credentialDeploymentTransaction, signatures);
    const transactionStatus = await client.waitForTransactionFinalization(transactionHash);
```
