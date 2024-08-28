import { serializeCIS2Transfers } from '../../src/cis2/util.ts';
import { serializeCIS3PermitMessage } from '../../src/cis3/util.ts';
import {
    AccountAddress,
    BlockHash,
    CIS3,
    CIS3Contract,
    ContractAddress,
    Energy,
    EntrypointName,
    Parameter,
    Timestamp,
    buildAccountSigner,
    serializeTypeValue,
    signMessage,
} from '../../src/index.js';
import { getNodeClientV2 } from './testHelpers.ts';

// Sponsoree and contract owner
const SPONSOREE = AccountAddress.fromBase58('4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj');
const SPONSOR = AccountAddress.fromBase58('3CnwP3DcvYdzHsjpU1Xme2sUS3ATK5qk2W7gi945vierMfLT7W');
const SPONSOREE_KEY = '6fb89ee03ea03d038ba0bfa62dbc29eec6f30b154f797cfa5c296beb1c178428';
// Contract that supports CIS2 tokens and the use of `permit` for transfers. SPONSOREE has a lot of tokens.
const CIS2_MULTI_CONTRACT = ContractAddress.create(8657);
const TOKEN_ID = '01';
const TEST_BLOCK = BlockHash.fromHexString('5f11cac7e4b81784dda33d46ffdef94e886db3321fb3a995f6b63eef8d4b68b7');

async function getContract() {
    const nodeClient = getNodeClientV2();
    return await CIS3Contract.create(nodeClient, CIS2_MULTI_CONTRACT);
}

async function makePermitParams(): Promise<CIS3.PermitParam> {
    const payload = serializeCIS2Transfers([
        {
            from: SPONSOREE,
            to: SPONSOR,
            tokenAmount: 1n,
            tokenId: TOKEN_ID,
        },
    ]);
    const message: CIS3.PermitMessage = {
        contractAddress: CIS2_MULTI_CONTRACT,
        nonce: 0n,
        timestamp: Timestamp.futureMinutes(5),
        entrypoint: EntrypointName.fromString('transfer'),
        payload: Parameter.fromBuffer(payload),
    };
    const serializedMessage = serializeCIS3PermitMessage(message);
    const signer = buildAccountSigner(SPONSOREE_KEY);
    const signature = await signMessage(SPONSOREE, serializedMessage, signer);
    return {
        signature,
        signer: SPONSOREE,
        message,
    };
}

describe('permit', () => {
    test('Invokes successfully', async () => {
        const contract = await getContract();
        const params = await makePermitParams();
        const res = await contract.dryRun.permit(SPONSOR, params, TEST_BLOCK);

        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const contract = await getContract();
        const params = await makePermitParams();

        const tx = contract.createPermit({ energy: Energy.create(100000) }, params);
        const schemaSerial = serializeTypeValue(tx.parameter.json, Buffer.from(tx.schema.value, 'base64'), true);
        expect(tx.parameter.hex).toEqual(Parameter.toHexString(schemaSerial));
    });
});

describe('supportsPermit', () => {
    test('Deserializes correctly', async () => {
        const contract = await getContract();

        const transferRes = await contract.supportsPermit(EntrypointName.fromString('transfer'), TEST_BLOCK);
        expect(transferRes).toBe(true);

        const mintRes = await contract.supportsPermit(EntrypointName.fromString('mint'), TEST_BLOCK);
        expect(mintRes).toBe(false);

        const multiRes = await contract.supportsPermit(
            [
                EntrypointName.fromString('transfer'),
                EntrypointName.fromString('updateOperator'),
                EntrypointName.fromString('mint'),
            ],
            TEST_BLOCK
        );
        expect(multiRes).toStrictEqual([true, true, false]);
    });
});
