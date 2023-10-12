import {
    Parameter,
    ReturnValue,
    SequenceNumber,
    Energy,
    TransactionHash,
    BlockHash,
    ContractName,
    InitName,
    ReceiveName,
    CredentialRegistrationId,
    AccountAddress,
    ContractAddress,
    EntrypointName,
    Timestamp,
    Duration,
    CcdAmount,
    TransactionExpiry,
    ModuleReference,
    DataBlob,
    jsonStringify,
    jsonParse,
} from '../../../src/pub/types.js';
import { JsonCircularReferenceError } from '../../../src/types/json.js';

describe('JSON ID test', () => {
    test('Stringified types are parsed correctly', () => {
        const original = {
            parameter: Parameter.fromHexString('010203'),
            nested: {
                returnValue: ReturnValue.fromHexString('020103'),
            },
            sequenceNumber: SequenceNumber.create(1),
            energy: Energy.create(123),
            transactionhash: TransactionHash.fromHexString(
                '443682391401cd5938a8b87275e5f5e6d0c8178d512391bca81d9a2a45f11a63'
            ),
            blockHash: BlockHash.fromHexString(
                'c2ef4acafd8ac8956ad941b4c4b87688baa714eb43510f078427db1b52e824e3 '
            ),
            some: {
                deeply: {
                    nested: {
                        contractName: ContractName.fromString('test-contract'),
                    },
                },
            },
            initName: InitName.fromString('init_another-contract'),
            receiveName: ReceiveName.fromString('some-contract.receive'),
            credRegId: CredentialRegistrationId.fromHexString(
                '83e4b29e1e2582a6f1dcc93bf2610ce6b0a6ba89c8f03e661f403b4c2e055d3adb80d071c2723530926bb8aed3ed52b1'
            ),
            accountAddress: AccountAddress.fromBase58(
                '35CJPZohio6Ztii2zy1AYzJKvuxbGG44wrBn7hLHiYLoF2nxnh'
            ),
            contractAddress: ContractAddress.create(1234),
            entrypointName: EntrypointName.fromString('entrypoint'),
            timestamp: Timestamp.fromDate(new Date()),
            duration: Duration.fromMillis(100000),
            ccdAmount: CcdAmount.fromMicroCcd(123),
            transactionExpiry: TransactionExpiry.futureMinutes(5),
            moduleRef: ModuleReference.fromHexString(
                '5d99b6dfa7ba9dc0cac8626754985500d51d6d06829210748b3fd24fa30cde4a'
            ),
            dataBlob: new DataBlob(Buffer.from('030201', 'hex')),
        };

        const json = jsonStringify(original);
        const parsed = jsonParse(json);

        expect(parsed).toEqual(original);
    });
});

describe('jsonStringify', () => {
    test('Throws on circular reference', () => {
        const obj = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any)['circular'] = obj;

        expect(() => jsonStringify(obj)).toThrowError(
            JsonCircularReferenceError
        );
    });

    test('Allow non-circular references to same object', () => {
        const other = { test: 1 };
        expect(() => jsonStringify([other, other])).not.toThrow();
    });
});
