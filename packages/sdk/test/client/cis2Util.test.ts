import {
    CIS2,
    deserializeCIS2Event,
    deserializeCIS2EventsFromSummary,
} from '../../src/cis2/util.js';
import * as wasm from '@concordium/rust-bindings';
import {
    AccountAddress,
    BlockItemSummary,
    ContractAddress,
    ContractEvent,
} from '../../src/pub/types.js';
import {
    SchemaEnumVariant,
    SchemaType,
    serializeSchemaType,
} from '../../src/schemaTypes.js';
import JSONbig from 'json-bigint';
import v8 from 'v8';
import fs from 'fs';

const TokenIdSchemaType: SchemaType = {
    type: 'ByteList',
    sizeLength: 'U8',
};

const TokenAmountSchemaType: SchemaType = {
    type: 'ULeb128',
    maxByteSize: 37,
};

const AddressSchemaType: SchemaType = {
    type: 'Enum',
    variants: [
        {
            name: 'Account',
            fields: {
                type: 'Unnamed',
                fields: [{ type: 'AccountAddress' }],
            },
        },
        {
            name: 'Contract',
            fields: {
                type: 'Unnamed',
                fields: [{ type: 'ContractAddress' }],
            },
        },
    ],
};

const CIS2TransferSchemaVariant: SchemaEnumVariant = {
    name: 'Transfer',
    fields: {
        type: 'Named',
        fields: [
            {
                name: 'token_id',
                field: TokenIdSchemaType,
            },
            {
                name: 'amount',
                field: TokenAmountSchemaType,
            },
            {
                name: 'from',
                field: AddressSchemaType,
            },
            {
                name: 'to',
                field: AddressSchemaType,
            },
        ],
    },
};

const CIS2MintSchemaVariant: SchemaEnumVariant = {
    name: 'Mint',
    fields: {
        type: 'Named',
        fields: [
            {
                name: 'token_id',
                field: TokenIdSchemaType,
            },
            {
                name: 'amount',
                field: TokenAmountSchemaType,
            },
            {
                name: 'owner',
                field: AddressSchemaType,
            },
        ],
    },
};

const CIS2BurnSchemaVariant: SchemaEnumVariant = {
    name: 'Burn',
    fields: CIS2MintSchemaVariant.fields,
};

const CIS2UpdateOperatorSchemaVariant: SchemaEnumVariant = {
    name: 'UpdateOperator',
    fields: {
        type: 'Named',
        fields: [
            {
                name: 'update',
                field: {
                    type: 'Enum',
                    variants: [
                        {
                            name: 'Remove',
                            fields: {
                                type: 'None',
                            },
                        },
                        {
                            name: 'Add',
                            fields: {
                                type: 'None',
                            },
                        },
                    ],
                },
            },
            {
                name: 'owner',
                field: AddressSchemaType,
            },
            {
                name: 'operator',
                field: AddressSchemaType,
            },
        ],
    },
};

const CIS2TokenMetadataSchemaVariant: SchemaEnumVariant = {
    name: 'TokenMetadata',
    fields: {
        type: 'Named',
        fields: [
            {
                name: 'token_id',
                field: TokenIdSchemaType,
            },
            {
                name: 'metadata_url',
                field: {
                    type: 'Struct',
                    fields: {
                        type: 'Named',
                        fields: [
                            {
                                name: 'url',
                                field: {
                                    type: 'String',
                                    sizeLength: 'U16',
                                },
                            },
                            {
                                name: 'hash',
                                field: {
                                    type: 'Enum',
                                    variants: [
                                        {
                                            name: 'None',
                                            fields: {
                                                type: 'None',
                                            },
                                        },
                                        {
                                            name: 'Some',
                                            fields: {
                                                type: 'Unnamed',
                                                fields: [
                                                    {
                                                        type: 'ByteArray',
                                                        size: 32,
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};

const CIS2EventSchemaType: SchemaType = {
    type: 'TaggedEnum',
    variants: new Map([
        [255, CIS2TransferSchemaVariant],
        [254, CIS2MintSchemaVariant],
        [253, CIS2BurnSchemaVariant],
        [252, CIS2UpdateOperatorSchemaVariant],
        [251, CIS2TokenMetadataSchemaVariant],
    ]),
};

function serializeJSONEvent(event: object): ContractEvent.Type {
    const serializedSchemaType = serializeSchemaType(CIS2EventSchemaType);
    const hexString = wasm.serializeTypeValue(
        JSONbig.stringify(event),
        Buffer.from(serializedSchemaType).toString('hex'),
        true
    );
    return ContractEvent.fromHexString(hexString);
}

test('CIS2 transfer events are deserialized correctly', async () => {
    const transferEvent = {
        Transfer: {
            token_id: 'ff',
            amount: '3',
            from: {
                Account: ['4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj'],
            },
            to: {
                Contract: [
                    {
                        index: 5,
                        subindex: 6,
                    },
                ],
            },
        },
    };
    const serializedTransferEvent = serializeJSONEvent(transferEvent);
    const deserializedTransferEvent = deserializeCIS2Event(
        serializedTransferEvent
    );

    const expectedDeserializedTransferEvent: CIS2.TransferEvent = {
        type: CIS2.EventType.Transfer,
        tokenId: '01ff',
        tokenAmount: 3n,
        from: AccountAddress.fromBase58(
            '4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj'
        ),
        to: ContractAddress.create(5, 6),
    };

    expect(deserializedTransferEvent).toEqual(
        expectedDeserializedTransferEvent
    );
});

test('CIS2 mint events are deserialized correctly', async () => {
    const mintEvent = {
        Mint: {
            token_id: 'ff',
            amount: '3',
            owner: {
                Account: ['4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj'],
            },
        },
    };
    const serializedMintEvent = serializeJSONEvent(mintEvent);
    const deserializedMintEvent = deserializeCIS2Event(serializedMintEvent);

    const expectedDeserializedMintEvent: CIS2.MintEvent = {
        type: CIS2.EventType.Mint,
        tokenId: '01ff',
        tokenAmount: 3n,
        owner: AccountAddress.fromBase58(
            '4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj'
        ),
    };

    expect(deserializedMintEvent).toEqual(expectedDeserializedMintEvent);
});

test('CIS2 burn events are deserialized correctly', async () => {
    const burnEvent = {
        Burn: {
            token_id: 'ff',
            amount: '3',
            owner: {
                Account: ['4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj'],
            },
        },
    };
    const serializedBurnEvent = serializeJSONEvent(burnEvent);
    const deserializedBurnEvent = deserializeCIS2Event(serializedBurnEvent);

    const expectedDeserializedBurnEvent: CIS2.BurnEvent = {
        type: CIS2.EventType.Burn,
        tokenId: '01ff',
        tokenAmount: 3n,
        owner: AccountAddress.fromBase58(
            '4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj'
        ),
    };

    expect(deserializedBurnEvent).toEqual(expectedDeserializedBurnEvent);
});

test('CIS2 update operator events are deserialized correctly', async () => {
    const updateOperatorEvent = {
        UpdateOperator: {
            update: { Add: [] },
            owner: {
                Account: ['4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj'],
            },
            operator: {
                Contract: [
                    {
                        index: 5,
                        subindex: 6,
                    },
                ],
            },
        },
    };
    const serializedUpdateOperatorEvent =
        serializeJSONEvent(updateOperatorEvent);
    const deserializedUpdateOperatorEvent = deserializeCIS2Event(
        serializedUpdateOperatorEvent
    );

    const expectedDeserializedUpdateOperatorEvent: CIS2.UpdateOperatorEvent = {
        type: CIS2.EventType.UpdateOperatorOf,
        updateOperatorData: {
            type: 'add',
            address: ContractAddress.create(5, 6),
        },
        owner: AccountAddress.fromBase58(
            '4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj'
        ),
    };

    expect(deserializedUpdateOperatorEvent).toEqual(
        expectedDeserializedUpdateOperatorEvent
    );
});

test('CIS2 token metadata events are deserialized correctly', async () => {
    const tokenMetadataEvent = {
        TokenMetadata: {
            token_id: 'ff',
            metadata_url: {
                url: 'https://example.com',
                hash: { None: [] },
            },
        },
    };
    const serializedTokenMetadataEvent = serializeJSONEvent(tokenMetadataEvent);
    const deserializedTokenMetadataEvent = deserializeCIS2Event(
        serializedTokenMetadataEvent
    );

    const expectedDeserializedTokenMetadataEvent: CIS2.TokenMetadataEvent = {
        type: CIS2.EventType.TokenMetadata,
        tokenId: '01ff',
        metadataUrl: {
            url: 'https://example.com',
        },
    };

    expect(deserializedTokenMetadataEvent).toEqual(
        expectedDeserializedTokenMetadataEvent
    );

    // Test with hash
    const tokenMetadataEventWithHash = {
        TokenMetadata: {
            token_id: 'ff',
            metadata_url: {
                url: 'https://example.com',
                hash: {
                    Some: [
                        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                    ],
                },
            },
        },
    };

    const serializedTokenMetadataEventWithHash = serializeJSONEvent(
        tokenMetadataEventWithHash
    );
    const deserializedTokenMetadataEventWithHash = deserializeCIS2Event(
        serializedTokenMetadataEventWithHash
    );

    const expectedDeserializedTokenMetadataEventWithHash: CIS2.TokenMetadataEvent =
        {
            type: CIS2.EventType.TokenMetadata,
            tokenId: '01ff',
            metadataUrl: {
                url: 'https://example.com',
                hash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            },
        };

    expect(deserializedTokenMetadataEventWithHash).toEqual(
        expectedDeserializedTokenMetadataEventWithHash
    );
});

test('Custom CIS2 events are deserialized correctly', async () => {
    const data = Uint8Array.from([250, 1, 2, 3]);
    const event = ContractEvent.fromBuffer(data);
    const deserializedCustomEvent = deserializeCIS2Event(event);
    const expectedDeserializedCustomEvent: CIS2.CustomEvent = {
        type: CIS2.EventType.Custom,
        data,
    };
    expect(deserializedCustomEvent).toEqual(expectedDeserializedCustomEvent);
});

test('CIS2 events are deserialized correctly from a BlockItemSummary', async () => {
    const blockItemSummary = v8.deserialize(
        fs.readFileSync('./test/client/resources/cis2-block-item-summary.bin')
    ) as BlockItemSummary;
    const events = deserializeCIS2EventsFromSummary(blockItemSummary);

    const expectedMetadataEvent: CIS2.TokenMetadataEvent = {
        type: CIS2.EventType.TokenMetadata,
        tokenId: '0101',
        metadataUrl: {
            url: 'example.com',
        },
    };
    const expectedMintEvent: CIS2.MintEvent = {
        type: CIS2.EventType.Mint,
        tokenId: '0101',
        tokenAmount: 100n,
        owner: AccountAddress.fromBase58(
            '4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj'
        ),
    };

    expect(events.length).toBe(2);
    expect(events).toContainEqual(expectedMetadataEvent);
    expect(events).toContainEqual(expectedMintEvent);
});
