import { ContractAddress, CredentialStatementBuilder } from '@concordium/web-sdk';

// #region documentation-snippet
let builder = new CredentialStatementBuilder();

// Add a web3 ID credential statements
builder = builder.forWeb3IdCredentials([ContractAddress.create(123)], (b) => b.addMembership('position', ['engineer']));

// Add an identity credential statement. Alternatively, if the proof produced from the
// statement should be tied to an account, use `builder.forAccountCredentials`.
builder = builder.forIdentityCredentials([0, 1], (b) => {
    b.addMinimumAge(18);
    b.addEUResidency();
    b.revealAttribute('firstName');
});

// Get the complete statement to request a proof of.
const statement = builder.getStatements();

console.log('successfully constructed statement', statement);
// #endregion documentation-snippet
