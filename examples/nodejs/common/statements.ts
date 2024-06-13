import { AttributesKeys, IdStatementBuilder, verifyIdstatement } from '@concordium/web-sdk';

/**
 * The following example shows how a proof statement can be built up.
 */

const statementBuilder = new IdStatementBuilder();

// #region documentation-snippet
// Prover's age must be over 18:
statementBuilder.addMinimumAge(18);

// Prover's country of nationality to be a EU member state:
statementBuilder.addEUNationality();
// Prover's country of residency to be a EU member state:
statementBuilder.addEUResidency();

// Prover must not be living in Germany or Poland.
//statementBuilder.addNonMembership(AttributesKeys.countryOfResidence, [
//    'DE',
//    'PT',
//]);

// We also reveal the type of documentation of the prover.
statementBuilder.revealAttribute(AttributesKeys.idDocType);

// The statement we wish to prove:
const statement = statementBuilder.getStatement();

// Test that the statement is well formed (validly constructed).
// Will throw otherwise.
verifyIdstatement(statement);

console.log('Succesfully constructed statement \n');
// #endregion documentation-snippet

console.dir(statement, { depth: null, colors: true });
