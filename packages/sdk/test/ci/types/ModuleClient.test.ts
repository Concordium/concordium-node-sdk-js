import {
    AccountAddress,
    ConcordiumGRPCClient,
    ContractName,
    Energy,
    ModuleClient,
    ModuleReference,
    Parameter,
    SequenceNumber,
    SimpleAccountKeys,
    TransactionExpiry,
    TransactionHash,
    buildAccountSigner,
} from '../../../src/index.js';

const SENDER = AccountAddress.fromBase58('4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd');
const KEY_1 = '11'.repeat(32);
const KEY_2 = '22'.repeat(32);
const TRANSACTION_HASH = TransactionHash.fromHexString('00'.repeat(32));

function mockGrpc(overrides: Partial<ConcordiumGRPCClient>) {
    return overrides as ConcordiumGRPCClient;
}

describe('createAndSendInitTransaction', () => {
    const signers: [string, SimpleAccountKeys][] = [
        ['one credential with one key', { 0: { 0: KEY_1 } }],
        ['one credential with two keys', { 0: { 0: KEY_1, 1: KEY_2 } }],
        ['two credentials with one key each', { 0: { 0: KEY_1 }, 1: { 0: KEY_2 } }],
    ];

    test.each(signers)('submits a signature for every key of a signer with %s', async (_, keys) => {
        const sendTransaction = jest.fn().mockResolvedValue(TRANSACTION_HASH);
        const grpc = mockGrpc({
            getNextAccountNonce: jest.fn().mockResolvedValue({ nonce: SequenceNumber.create(1), allFinal: true }),
            sendTransaction,
        });
        const moduleClient = ModuleClient.createUnchecked(grpc, ModuleReference.fromHexString('00'.repeat(32)));

        const hash = await ModuleClient.createAndSendInitTransaction(
            moduleClient,
            ContractName.fromString('test'),
            { senderAddress: SENDER, energy: Energy.create(1000), expiry: TransactionExpiry.futureMinutes(5) },
            Parameter.empty(),
            buildAccountSigner(keys)
        );

        expect(hash).toBe(TRANSACTION_HASH);
        const [{ signature }] = sendTransaction.mock.calls[0];
        for (const [credential, credentialKeys] of Object.entries(keys)) {
            expect(Object.keys(signature[credential])).toEqual(Object.keys(credentialKeys));
        }
    });
});
