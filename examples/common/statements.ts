import {
    IdStatementBuilder,
    verifyIdstatement,
    AttributesKeys,
} from '@concordium/node-sdk';

/**
 * The following example shows how a proof statement can be built up.
 */

const statementBuilder = new IdStatementBuilder();

(async () => {
    // #region documentation-snippet
    // Prover's age must be over 18:
    statementBuilder.addMinimumAge(18);

    // Prover's country of nationality to be a EU member state:
    statementBuilder.addEUNationality();
    // Prover's country of residency to be a EU member state:
    statementBuilder.addEUResidency();

    // We also reveal the type of documentation of the prover.
    statementBuilder.revealAttribute(AttributesKeys.idDocType);

    // Our proof statement:
    const statement = statementBuilder.getStatement();

    // Test that the statement is well formed (validly constructed).
    // Will throw otherwise.
    verifyIdstatement(statement);

    console.log('Succesfully constructed statement \n');

    console.dir(statement, { depth: null, colors: true });
    // #endregion documentation-snippet
})();
