# Verifiable Presentations (V1)

This document describes how to create v1 verifiable presentations and how to verify them.

**Table of Contents:**
<!--toc:start-->
- [Build Subject Claims](#build-subject-claims)
  - [Identity/account credential claims](#identityaccount-credential-claims)
- [JSON representation](#json-representation)
- [Verification Request](#verification-request)
- [Verifiable Presentation](#verifiable-presentation)
- [Verifiable Audit Record](#verifiable-audit-record)
<!--toc:end-->

## Build Subject claims

The SDK contains a helper to create as set of subject claims about identities, which can
then be proven.

To do so, use the _presentation request claims builder_, to build a aet of claims:

{@codeblock ~~:nodejs/common/verifiable-credential-claims.ts#documentation-snippet}

### Identity/account credential claims

To build a set of claims against an identity credential, the builder has two different entrypoints, which
have an identical function signature, which consists of

1. A list of identity providers that the identity must be created from
2. A callback function which should be used to add claims for the credential

```ts
// used for proofs tied to an account created from the identity credential.
builder.addAccountClaims([0,2].map(idp => new IdentityProviderDID('Testnet', idp)), (build) => ...)
// used for proofs which are not tied to a specific account
builder.addIdentityClaims([0,2].map(idp => new IdentityProviderDID('Testnet', idp)), (build) => ...)
// alternatively let the application producing the proof decide
builder.addAccountOrIdentityClaims([0,2].map(idp => new IdentityProviderDID('Testnet', idp)), (build) => ...)
```

Below are a set of functions accessible for the `build` object passed in the callback

#### Minimum Age

There is a helper function for specifying the prover must have some minimum
age.

Example: add the statement that the prover must be at least 18 years old:

```ts
    build.addMinimumAge(18);
```

#### Maximum Age

There is a helper function for specifying the prover must have some maximum
age.

Example: add the statement that the prover must be at most 27 years old:

```ts
    build.addMaximumAge(27);
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

Example: add the statement that the prover's country of residency is France or Spain,
specified in ISO3166-1 alpha-2 format:

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

## JSON representation

The `VerificationRequestV1`, `VerifiablePresentationV1`, and `VerifiableAuditRecordV1` can be represented as
JSON by calling the associated `.toJSON` method (will also be called implicitly with `JSON.stringify`). Correspondingly,
parsing the JSON values can be done with the `.fromJSON` function exposed for each type.

> bigints are used internally in the types described above and need to be handled with something like `json-bigint`

Example: service serializes presentation request in response to frontend; frontend deserializes and parses the JSON.

```ts
const json = JSON.stringify(presentationRequest); // service sends back presentation request to frontend
...
const presentationRequest = VerificationRequestV1.fromJSON(JSON.parse(json)); // frontend parses the JSON.
```

## Verification Request

To get a _verifiable presentation_ of one or more _verifiable credentials_ owned by a user, the entity requesting
the information must first build a _verification request_. In the V1 protocol, this is done in the following
sequence:

1. Make the _request context_, consisting of
  a. a unique 32-byte "nonce"
  b. a "connection ID" which identifies the connection between prover and requester
  c. a "context string" which describes the context of the proof request, e.g. which store is being accessed
  d. a set of requested context values, identified by their labels. For now the defaults here are: the block hash of the
     anchor transaction and the resource ID (i.e. an identifier of the requester, e.g. a url of the website). The
     requested context is filled out by the application creating the proof.
2. [Build the claims](#build-subject-claims) to be proven by the user

Once this is done, the request must be _anchored_ on chain with a transaction. This can be achieved by calling

```ts
const nonce = Uint8Array.from(...) // randomly generated 32-byte value
const connectionID = ... // e.g. a wallet-connect ID
const contextString = 'My compliant web3 wine shop'
const context = VerificationRequestV1.createSimpleContext(nonce, connectionID, contextString)

const statement = new VerificationRequestV1.claimsBuilder()...

// a GRPC client connected a node on the network the anchor should be registered on
const grpcClient: ConcordiumGRPCClient = ...;
// the sender of the anchor transaction
const sender: AccountAddress.Type = ...;
// the keys for the account to sign the anchor transaction
const signer: Signer = ...;

// create the verification request with an on-chain anchor, which can be checked by the owner of the credentials.
const verificationRequest = await VerificationRequestV1.createAndAnchor(
    grpcClient,
    { sender, signer }
    context,
    statement
);
```

## Verifiable Presentation

Computing a _verifiable presentation_ from a _verifiable presentation request_ is a process of the following sequence
for each credential statement in the request:

1. Identify valid credentials for the statement by looking at the ID qualifier of the
   `VerificationRequestV1.SubjectClaims`.
2. Validate the attributes of the credential in the context of the set of claims.
3. Construct a `VerifiablePresentationV1.SubjectClaims` corresponding to the credential. This is is _not_ the same as the
   `VerificationRequestV1.Statement` we built for the `VerificationRequestV1` previously; here we're working with
   a specific credential, e.g. from the users wallet.
    a. for `VerificationRequestV1.IdentityStatement`s, the `source` also needs to be taken into account. This
       specifies the type of credential requested by the dapp. This can either be set to
       `["Identity"] | ["Account"] | ["Identity", "Account"]`, where the latter means that the application constructing
       the proof can decide which proof to construct for the statement.

When this is done for all credential statements in the request, we construct the _proof context_ corresponding to the
_request context_ of the request, specifying values for each requested context value in
`VerificationRequestV1.Context.requested`.

```ts
// specify the resource ID (e.g. website URL or fingerprint of TLS certificate that the wallet is connected to)
// from the connection to the requester of the proof. The block hash is _not_ specified here, as it is looked up
// later in `VerifiablePresentationV1.createFromAnchor` from the anchor transaction reference in the presentation
// request.
const contextValues: GivenContext[] = [{label: 'ResourceID', context: ...}];

// The application goes through each set of claims in the verification request, and constructs a corresponding set of
// claims used as input to the presentation. The difference between the two statement types boil down to the presence
// of an ID qualifier vs. an ID (selected by the application based on the id qualifier).
const statements: VerifiablePresentationV1.SubjectClaims[] = verificationRequest.subjectClaims.map((entry) => {
    // prioritize creating identity based proofs, as these are more privacy-preserving
    if (entry.source.includes('identity'))
        return VerifiablePresentationV1.createIdentityClaims(..., entry.statement);
    return VerifiablePresentation.createAccountClaims(..., entry.statement);
});

// the inputs for the credential owned by the user, i.e. credential attribute values. For each
// `VerifiablePresentationV1.SubjectClaims`, there should be a corresponding input
const inputs: CommitmentInput[] = [
    createIdentityCommitmentInputWithHdWallet(...),
    createAccountCommitmentInputWithHdWallet(...),
];

const presentation = await VerifiablePresentationV1.createFromAnchor(
    grpcClient,
    verificationRequest,
    statements,
    inputs,
    contextValues
);
```

## Verifiable Audit Record

Services can opt in to create a _verification audit record_ from the _verification request_ and corresponding
_verifiable presentation_. This exists as a record and a corresponding anchor. The record should be stored by the dapp backend (e.g. in a database),
and the anchor should be registered on chain. The transacton hash of the anchor registration should be stored along the record.

```ts
const uuid: string = ...;
// Verify the presentation in the context of the verification request and create the audit record.
const record = VerificationAuditRecordV1.createChecked(uuid, verificationRequest, presentation, grpcClient, network);
// Register the verification audit anchor on the chain
const anchorTransactionHash = await VerificationAuditRecordV1.registerAnchor(record, grpcClient, { sender, signer });
```
