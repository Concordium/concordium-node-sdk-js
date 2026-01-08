import { IdentityProviderDID, VerificationRequestV1 } from '@concordium/web-sdk';

// #region documentation-snippet
let builder = VerificationRequestV1.claimsBuilder();

// Add a set of identity credential claims. Alternatively, if the proof produced from the
// claims should be tied to an account, use `builder.addAccountClaims`.
// A third option `builder.addAccountOrIdentityClaims`exists where it's up to the
// application holding the credentials to decide which proof is produced.
builder = builder.addIdentityClaims(
    [0, 1].map((idpIndex) => new IdentityProviderDID('Testnet', idpIndex)),
    (b) => {
        b.addMinimumAge(18);
        b.addEUResidency();
        b.revealAttribute('firstName');
    }
);

// Get the complete set of claims to request a proof of.
const claims = builder.getClaims();

console.log('successfully constructed subject claims', claims);
// #endregion documentation-snippet
