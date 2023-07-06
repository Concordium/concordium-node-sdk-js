import fs from 'fs';
import { Buffer } from 'buffer/';
import {
    displayTypeSchemaTemplate,
    getUpdateContractParameterSchema,
} from '../src/schemaHelpers';

test('schema template display', () => {
    const fullSchema = Buffer.from(
        fs.readFileSync('./test/resources/cis2-nft-schema.bin')
    );
    const schemaVersion = 1;
    const contractName = 'CIS2-NFT';
    const functionName = 'transfer';
    const template = displayTypeSchemaTemplate(
        getUpdateContractParameterSchema(
            fullSchema,
            contractName,
            functionName,
            schemaVersion
        )
    );
    expect(template).toBe(
        '[{"amount":["<UInt8>","<UInt8>"],"data":["<UInt8>"],"from":{"Enum":[{"Account":["<AccountAddress>"]},{"Contract":[{"index":"<UInt64>","subindex":"<UInt64>"}]}]},"to":{"Enum":[{"Account":["<AccountAddress>"]},{"Contract":[{"index":"<UInt64>","subindex":"<UInt64>"},{"contract":"<String>","func":"<String>"}]}]},"token_id":["<UInt8>"]}]'
    );
});
