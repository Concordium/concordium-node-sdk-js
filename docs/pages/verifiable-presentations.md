# Verifiable Presentations (V1)

This document describes how to create v1 verifiable presentations and how to verify them.

**Table of Contents:**
<!--toc:start-->
- [Build Statement](#build-statement)
  - [Identity/account credential statements](#identityaccount-credential-statements)
  - [Web3 ID credential statements](#web3-id-credential-statements)
- [JSON representation](#json-representation)
- [Verifiable Presentation Request (proof request)](#verifiable-presentation-request-proof-request)
- [Verifiable Presentation (proof)](#verifiable-presentation-proof)
- [Verifiable Audit Record](#verifiable-audit-record)
<!--toc:end-->

## Build Statement

The SDK contains a helper to create statements about identities, which can
then be proven.

To do so, use the _presentation request statement builder_, to build a statement:

{@codeblock ~~:nodejs/common/verifiable-credential-statements.ts#documentation-snippet}

### Identity/account credential statements

To build a statement against an identity credential, the builder has two different entrypoints, which
have an identical function signature, which consists of

1. A list of identity providers that the identity must be created from
2. A callback function which should be used to add statements for the credential

```ts
// used for proofs which are not tied to a specific account
builder.addAccountStatement([0,2].map(idp => new IdentityProviderDID('Testnet', idp)), (build) => ...)
// used for proofs tied to an account created from the identity credential.
builder.addIdentityStatement([0,2].map(idp => new IdentityProviderDID('Testnet', idp)), (build) => ...)
// alternatively let the application producing the proof decide
builder.addAccountOrIdentityStatement([0,2].map(idp => new IdentityProviderDID('Testnet', idp)), (build) => ...)
```

Below are a set of functions accessible for the `build` object passed in the callback

#### Minimum Age

There is a helper function for specifying the prover must have some minimum
age.

Example: add the statement that the prover must be at least 18 years old:

```ts
    build.addMinimumAge(18);
```

#### EU membership

There are helpers for specifying the country of residency or nationality to
be one of the EU member states.

```ts
    build.addEUNationality();
    build.addEUResidency();
```

#### Reveal statement

State that a given attribute should be revealed as part of the proof.

```ts
    build.revealAttribute(AttributesKeys.nationality);
```

#### Range statement

State that a given attribute should be between 2 given values.

Example: add the statement that the prover must be born between January 1,
1941 and Februar 2, 2005.

```ts
    build.addRange(AttributesKeys.dob, 19410101, 20050202);
```

Note that this type of statement is only allowed for the following attributes:

- dob (date of birth)
- idDocIssuedAt
- idDocExpiresAt

#### Membership statement

Example: add the statement that the prover's country of residency is France or Spain:

```ts
    build.addMembership(AttributesKeys.CountryOfResidency, ['FR', 'ES']);
```

Note that this type of statement is only allowed for the following attributes:

- Nationality
- CountryOfResidency
- IdDocIssuer
- IdDocType

#### Non membership statement

Example: add the statement that the prover's country of residency not Germany
nor Portugal:

```ts
    build.addNonMembership(AttributesKeys.CountryOfResidency, ['DE', 'PT']);
```

Note that this type of statement is only allowed for the following attributes:

- Nationality
- CountryOfResidency
- IdDocIssuer
- IdDocType

### Web3 ID credential statements

To build a statement against a Web3 ID, the builder has exposes an entrypoint `addWeb3IdStatement`,
which has a function signature similar to those used for [identity/account statements](#identityaccount-credential-statements)

1. A list smart contract addresses the Web3 ID must be created from
2. A callback function which should be used to add statements for the credential

#### Reveal statement

State that a given attribute should be revealed as part of the proof.

Example: reveal the education degree of an education ID.

```ts
    build.revealAttribute('degree');
```

#### Range statement

State that a given attribute should be between 2 given values.

Example: add the statement that the prover must be hired between January 1,
2015 and Februar 2, 2005.

```ts
    build.addRange('hired', 20150101, 20050202);
```

#### Membership statement

Example: add the statement that the prover's position in a company is either "engineer" or "designer"

```ts
    build.addMembership('position', ['engineer', 'designer']);
```

#### Non membership statement

Example: add the statement that the prover's position in a company is _not_ "manager":

```ts
    build.addNonMembership('position', ['manager']);
```

## JSON representation

The `VerifiablePresentationRequestV1`, `VerifiablePresentationV1`, and `VerifiableAuditRecordV1` can be represented as
JSON by calling the associated `.toJSON` method (will also be called implicitly with `JSON.stringify`). Correspondingly,
parsing the JSON values can be done with the `.fromJSON` function exposed for each type.

> bigints are used internally in the types described above and need to be handled with something like `json-bigint`

Example: service serializes presentation request in response to frontend; frontend deserializes and parses the JSON.

```ts
const json = JSON.stringify(presentationRequest); // service sends back presentation request to frontend
...
const presentationRequest = VerifiablePresentationRequestV1.fromJSON(JSON.parse(json)); // frontend parses the JSON.
```

## Verifiable Presentation Request (proof request)

To get a _verifiable presentation_ of one or more _verifiable credentials_ owned by a user, the entity requesting
the information must first build a _verifiable presentation request_. In the V1 protocol, this is done in the following
sequence:

1. Make the _request context_, consisting of
  a. a unique 32-byte "nonce"
  b. a "connection ID" which identifies the connection between prover and requester
  c. a "context string" which describes the context of the proof request, e.g. which store is being accessed
  d. a set of requested context values, identified by their labels. For now the defaults here are: the block hash of the
     anchor transaction and the resource ID (i.e. an identifier of the requester, e.g. a url of the website)
2. [Build the statement](#build-statement) to be proven by the user

Once this is done, the request must be _anchored_ on chain with a transaction. This can be achieved by calling

```ts
const nonce = Uint8Array.from(...) // randomly generated 32-byte value
const connectionID = ... // e.g. a wallet-connect ID
const contextString = 'My compliant web3 wine shop'
const context = VerifiablePresentationRequestV1.createSimpleContext(nonce, connectionID, contextString)

const statement = new VerifiablePresentationRequestV1.statementBuilder()...

// a GRPC client connected a node on the network the anchor should be registered on
const grpcClient: ConcordiumGRPCClient = ...;
// the sender of the anchor transaction
const sender: AccountAddress.Type = ...;
// the keys for the account to sign the anchor transaction
const signer: Signer = ...;

// create the presentation request with an on-chain anchor, which can be checked by the owner of the credentials.
const presentationRequest = await VerifiablePresentationRequestV1.createAndAchor(
    grpcClient,
    sender,
    signer,
    context,
    statement
);
```

## Verifiable Presentation (proof)

Computing a _verifiable presentation_ from a _verifiable presentation request_ is a process of the following sequence
for each credential statement in the request:

1. Identify valid credentials for the statement by looking at the ID qualifier of the statement.
2. Validate the attributes of the credential in the context of the statement.
3. Construct a `SpecifiedCredentialStatement` corresponding to the credential. This is is _not_ the same as the
   `CredentialStatement` we built for the `VerfiablePresentationRequest` previously; here we're working with
   a specific credential, e.g. from the users wallet.

When this is done for all credential statements in the request, we construct the _proof context_ corresponding to the
_request context_ of the request, specifying values for each requested context value in
`VerifiablePresentationRequestV1.Context.requested`.

```ts
// specify the resource ID (e.g. website URL or fingerprint of TLS certificate that the wallet is connected to) from the connection to the requester of the proof
// the block hash is automatically derived from the request
const contextValues: GivenContext[] = [{label: 'ResourceID', context: ...}];

// The application holding the credentials selects the credentials to use and creates a DIDString from them.
// This will be a combination of the below, i.e. probably not all at once
const selectedCredentialIds: DIDString[] = [
    createIdentityStatementDID(...),
    createAccountDID(...),
    createWeb3IdDID(...),
];

// These are then paired with the statements from the verifiable presentation request to form the statements
// required for the verifiable presentation input:
const statements: VerifiablePresentationV1.Statement[] = selectedCredentialIds.map((id, i) => ({
    id,
    statement: presentationRequest.credentialStatements[i].statement
}));

// the inputs for the credential owned by the user, i.e. credential attribute values. For each
// `SpecifiedCredentialStatement`, there should be a corresponding input
const inputs: CommitmentInput[] = [
    createIdentityCommitmentInputWithHdWallet(...),
    createAccountCommitmentInputWithHdWallet(...),
    createWeb3CommitmentInputWithHdWallet(...)
];

const presentation = await VerifiablePresentationV1.createFromAnchor(
    grpcClient,
    presentationRequest,
    statements,
    inputs,
    contextValues
);

// verify the presentation elsewhere
const result = VerifiablePresentationV1.verifyWithNode(presentation, presentationRequest, grpcClient, network);
```

## Verifiable Audit Record

Services can opt in to create a _verification audit record_ from the _verifiable presentation request_ and corresponding
_verifiable presentation_. This exists as a record and a corresponding anchor. The record should be stored by the dapp backend (e.g. in a database),
and the anchor should be registered on chain. The transacton hash of the anchor registration should be stored along the record.

```ts
const uuid: string = ...;
const record = VerificationAuditRecordV1.create(uuid, presentationRequest, presentation);
const anchorTransactionHash = await VerificationAuditRecordV1.registerAnchor(record, grpcClient, sender, signer);
```
