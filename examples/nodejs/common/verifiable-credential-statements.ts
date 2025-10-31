import { IdentityProviderDID, VerifiablePresentationRequestV1 } from '@concordium/web-sdk';

// #region documentation-snippet
let builder = VerifiablePresentationRequestV1.statementBuilder();

// Add an identity credential statement. Alternatively, if the proof produced from the
// statement should be tied to an account, use `builder.addAccountStatement`.
// A third option `builder.addAccountOrIdentityStatement`exists where it's up to the
// application holding the credentials to decide which proof is produced.
builder = builder.addIdentityStatement(
    [0, 1].map((idpIndex) => new IdentityProviderDID('Testnet', idpIndex)),
    (b) => {
        b.addMinimumAge(18);
        b.addEUResidency();
        b.revealAttribute('firstName');
    }
);

// Get the complete statement to request a proof of.
const statement = builder.getStatements();

console.log('successfully constructed statement', statement);
// #endregion documentation-snippet
