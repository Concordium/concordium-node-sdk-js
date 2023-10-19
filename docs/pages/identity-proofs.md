
This document describes how to create proof statements and how to verify them.

**Table of Contents:**
<!--toc:start-->
- [Build Statement](#build-statement)
  - [Minimum Age](#minimum-age)
  - [Eu membership](#eu-membership)
  - [Reveal statement](#reveal-statement)
  - [Range statement](#range-statement)
  - [Membership statement](#membership-statement)
  - [Non membership statement](#non-membership-statement)
- [Verify Statement (verifyIdstatement)](#verify-statement-verifyidstatement)
- [Prove Statement (getIdProof)](#prove-statement-getidproof)
<!--toc:end-->

## Build Statement

The SDK contains a helper to create statements about identities, which can
then be proven.

To do so, use the IdStatementBuilder, to build a statement:

{@codeblock ~~:common/statements.ts#documentation-snippet}

The statement can then be proved using the `getIdProof`, or be provided to a
wallet for them it to provide a proof for the statement. There are currently
4 types of the statements, and if multiple are added, the resulting statement
is the conjunction between them.

| Attribute name     | Format                                                                      |
|--------------------|-----------------------------------------------------------------------------|
| firstName          | string                                                                      |
| lastName           | string                                                                      |
| sex                | ISO/IEC 5218                                                                |
| dob                | ISO8601 YYYYMMDD                                                            |
| countryOfResidence | ISO3166-1 alpha-2                                                           |
| nationality        | ISO3166-1 alpha-2                                                           |
| idDocType          | na=0, passport=1, national id card=2, driving license=3, immigration card=4 |
| idDocNo            | string                                                                      |
| idDocIssuer        | ISO3166-1 alpha-2 or ISO3166-2 if applicable                                |
| idDocIssuedAt      | ISO8601 YYYYMMDD                                                            |
| idDocExpiresAt     | ISO8601 YYYYMMDD                                                            |
| nationalIdNo       | string                                                                      |
| taxIdNo            | string                                                                      |

The first parameter of the statement builder is a boolean, which defaults to
true, that specifies whether the statement should be checked while being built.

It checks that:

- The used attribute tag is a known one
- There is not multiple statements on the same attribute
- Lower, upper and sets members have the format expected of the attribute

### Minimum Age

There is a helper function for specifying the prover must have some minimum
age.

Example: add the statement that the prover must be born at least 18 years old:

```ts
    statementBuilder.addMinimumAge(18);
```

### Eu membership

There are helpers for specifying the country of residency or nationality to
be one of the EU member states.

```ts
    statementBuilder.addEUNationality();
    statementBuilder.addEUResidency();
```

### Reveal statement

State that a given attribute should be revealed as part of the proof.

```ts
    statementBuilder.revealAttribute(AttributesKeys.nationality);
```

### Range statement

State that a given attribute should be between 2 given values.

Example: add the statement that the prover must be born between January 1,
1941 and Februar 2, 2005.

```ts
    statementBuilder.addRange(AttributesKeys.dob, 19410101, 20050202);
```

Note that this type of statement is only allowed for the following attributes:

- dob (date of birth)
- idDocIssuedAt
- idDocExpiresAt

### Membership statement

Example: add the statement that the prover's country of residency is France or Spain:

```ts
    statementBuilder.addMembership(AttributesKeys.CountryOfResidency, ['FR', 'ES']);
```

Note that this type of statement is only allowed for the following attributes:

- Nationality
- CountryOfResidency
- IdDocIssuer
- IdDocType

### Non membership statement

Example: add the statement that the prover's country of residency not Germany
nor Portugal:

```ts
    statementBuilder.addNonMembership(AttributesKeys.CountryOfResidency, ['DE', 'PT']);
```

Note that this type of statement is only allowed for the following attributes:

- Nationality
- CountryOfResidency
- IdDocIssuer
- IdDocType

## Verify Statement (verifyIdstatement)

The SDK provides a helper function (`verifyIdstatement`) to verify a statement,
that it is well-formed and complies with the current rules. It will throw
an error if the statement does not verify:

```ts
    const statement = ...
    let isValid = true;
    try {
        verifyIdstatement(statement);
    } catch (e) {
        // States why the statement is not valid:
        console.log(e.message);
        isValid = false;
    }
```

## Prove Statement (getIdProof)

The SDK provides a helper function (`getIdProof`) to prove an id statement:

```ts
    const statement = ...
    const challenge = ...
    const proof = getIdProof({
        idObject,
        globalContext,
        seedAsHex,
        net: 'Mainnet',
        identityProviderIndex,
        identityIndex,
        credNumber,
        statement,
        challenge,
    })
```
