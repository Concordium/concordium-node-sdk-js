import * as wasm from '@concordium/rust-bindings';
import fs from 'fs';
import JSONbig from 'json-bigint';
import v8 from 'v8';

import { CIS4, deserializeCIS4Event, deserializeCIS4EventsFromSummary } from '../../src/cis4/util.js';
import { SchemaEnumVariant, SchemaType, serializeSchemaType } from '../../src/schemaTypes.js';
import { BlockItemSummary } from '../../src/types.js';
import * as ContractEvent from '../../src/types/ContractEvent.js';

function optionSchemaType(innerType: SchemaType): SchemaType {
    return {
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
                    fields: [innerType],
                },
            },
        ],
    };
}

const PublicKeySchemaType: SchemaType = {
    type: 'ByteArray',
    size: 32,
};

const CredentialTypeSchemaType: SchemaType = {
    type: 'String',
    sizeLength: 'U8',
};

const MetadataUrlSchemaType: SchemaType = {
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
};

const RevokerSchemaType: SchemaType = {
    type: 'Enum',
    variants: [
        {
            name: 'Issuer',
            fields: {
                type: 'None',
            },
        },
        {
            name: 'Holder',
            fields: {
                type: 'None',
            },
        },
        {
            name: 'Other',
            fields: {
                type: 'Unnamed',
                fields: [PublicKeySchemaType],
            },
        },
    ],
};

const ReasonSchemaType: SchemaType = optionSchemaType({
    type: 'String',
    sizeLength: 'U8',
});

const RevocationKeyActionSchemaType: SchemaType = {
    type: 'Enum',
    variants: [
        {
            name: 'Register',
            fields: {
                type: 'None',
            },
        },
        {
            name: 'Remove',
            fields: {
                type: 'None',
            },
        },
    ],
};

const CIS4RegisterSchemaVariant: SchemaEnumVariant = {
    name: 'Register',
    fields: {
        type: 'Named',
        fields: [
            {
                name: 'holder_id',
                field: PublicKeySchemaType,
            },
            {
                name: 'schema_ref',
                field: MetadataUrlSchemaType,
            },
            {
                name: 'credential_type',
                field: CredentialTypeSchemaType,
            },
            {
                name: 'metadata_url',
                field: MetadataUrlSchemaType,
            },
        ],
    },
};

const CIS4RevokeSchemaVariant: SchemaEnumVariant = {
    name: 'Revoke',
    fields: {
        type: 'Named',
        fields: [
            {
                name: 'holder_id',
                field: PublicKeySchemaType,
            },
            {
                name: 'revoker',
                field: RevokerSchemaType,
            },
            {
                name: 'reason',
                field: ReasonSchemaType,
            },
        ],
    },
};

const CIS4IssuerMetadataSchemaVariant: SchemaEnumVariant = {
    name: 'IssuerMetadata',
    fields: MetadataUrlSchemaType.fields,
};

const CIS4CredentialMetadataSchemaVariant: SchemaEnumVariant = {
    name: 'CredentialMetadata',
    fields: {
        type: 'Named',
        fields: [
            {
                name: 'credential_id',
                field: PublicKeySchemaType,
            },
            {
                name: 'metadata_url',
                field: MetadataUrlSchemaType,
            },
        ],
    },
};

const CIS4SchemaSchemaVariant: SchemaEnumVariant = {
    name: 'Schema',
    fields: {
        type: 'Named',
        fields: [
            {
                name: 'credential_type',
                field: CredentialTypeSchemaType,
            },
            {
                name: 'schema_ref',
                field: MetadataUrlSchemaType,
            },
        ],
    },
};

const CIS4RevocationKeySchemaVariant: SchemaEnumVariant = {
    name: 'RevocationKey',
    fields: {
        type: 'Named',
        fields: [
            {
                name: 'key',
                field: PublicKeySchemaType,
            },
            {
                name: 'action',
                field: RevocationKeyActionSchemaType,
            },
        ],
    },
};

const CIS4EventSchemaType: SchemaType = {
    type: 'TaggedEnum',
    variants: new Map([
        [249, CIS4RegisterSchemaVariant],
        [248, CIS4RevokeSchemaVariant],
        [247, CIS4IssuerMetadataSchemaVariant],
        [246, CIS4CredentialMetadataSchemaVariant],
        [245, CIS4SchemaSchemaVariant],
        [244, CIS4RevocationKeySchemaVariant],
    ]),
};

function serializeJSONEvent(event: object): ContractEvent.Type {
    const serializedSchemaType = serializeSchemaType(CIS4EventSchemaType);
    const hexString = wasm.serializeTypeValue(
        JSONbig.stringify(event),
        Buffer.from(serializedSchemaType).toString('hex'),
        true
    );
    return ContractEvent.fromHexString(hexString);
}

test('CIS-4 Register events are deserialized correctly', () => {
    const registerEvent = {
        Register: {
            holder_id: '1'.repeat(64),
            schema_ref: {
                url: 'https://schema.ref',
                hash: {
                    None: [],
                },
            },
            credential_type: 'example',
            metadata_url: {
                url: 'https://metadata.url',
                hash: {
                    Some: ['2'.repeat(64)],
                },
            },
        },
    };
    const serializedRegisterEvent = serializeJSONEvent(registerEvent);
    const deserializedRegisterEvent = deserializeCIS4Event(serializedRegisterEvent);

    const expectedRegisterEvent: CIS4.RegisterCredentialEvent = {
        type: CIS4.EventType.RegisterCredential,
        credentialPubKey: '1'.repeat(64),
        schemaRef: {
            url: 'https://schema.ref',
        },
        credentialType: 'example',
        metadataUrl: {
            url: 'https://metadata.url',
            hash: '2'.repeat(64),
        },
    };
    expect(deserializedRegisterEvent).toEqual(expectedRegisterEvent);
});

test('CIS-4 Revoke events are deserialized correctly', () => {
    const revokeEvent = {
        Revoke: {
            holder_id: '1'.repeat(64),
            revoker: {
                Holder: [],
            },
            reason: {
                None: [],
            },
        },
    };
    const serializedRegisterEvent = serializeJSONEvent(revokeEvent);
    const deserializedRegisterEvent = deserializeCIS4Event(serializedRegisterEvent);

    const expectedRevokeEvent: CIS4.RevokeCredentialEvent = {
        type: CIS4.EventType.RevokeCredential,
        credentialPubKey: '1'.repeat(64),
        revoker: {
            type: CIS4.RevokerType.Holder,
        },
    };
    expect(deserializedRegisterEvent).toEqual(expectedRevokeEvent);

    const revokeEventWithReason = {
        Revoke: {
            holder_id: '1'.repeat(64),
            revoker: {
                Other: ['2'.repeat(64)],
            },
            reason: {
                Some: ['reason'],
            },
        },
    };

    const serializedRevokeEventWithReason = serializeJSONEvent(revokeEventWithReason);
    const deserializedRevokeEventWithReason = deserializeCIS4Event(serializedRevokeEventWithReason);

    const expectedRevokeEventWithReason: CIS4.RevokeCredentialEvent = {
        type: CIS4.EventType.RevokeCredential,
        credentialPubKey: '1'.repeat(64),
        revoker: {
            type: CIS4.RevokerType.Other,
            key: '2'.repeat(64),
        },
        reason: 'reason',
    };
    expect(deserializedRevokeEventWithReason).toEqual(expectedRevokeEventWithReason);
});

test('CIS-4 IssuerMetadata events are deserialized correctly', () => {
    const issuerMetadataEvent = {
        IssuerMetadata: {
            url: 'https://issuer.metadata',
            hash: {
                Some: ['1'.repeat(64)],
            },
        },
    };
    const serializedIssuerMetadataEvent = serializeJSONEvent(issuerMetadataEvent);
    const deserializedIssuerMetadataEvent = deserializeCIS4Event(serializedIssuerMetadataEvent);

    const expectedIssuerMetadataEvent: CIS4.IssuerMetadataEvent = {
        type: CIS4.EventType.IssuerMetadata,
        metadataUrl: {
            url: 'https://issuer.metadata',
            hash: '1'.repeat(64),
        },
    };
    expect(deserializedIssuerMetadataEvent).toEqual(expectedIssuerMetadataEvent);
});

test('CIS-4 CredentialMetadata events are deserialized correctly', () => {
    const credentialMetadataEvent = {
        CredentialMetadata: {
            credential_id: '1'.repeat(64),
            metadata_url: {
                url: 'https://credential.metadata',
                hash: {
                    Some: ['0'.repeat(64)],
                },
            },
        },
    };
    const serializedCredentialMetadataEvent = serializeJSONEvent(credentialMetadataEvent);
    const deserializedCredentialMetadataEvent = deserializeCIS4Event(serializedCredentialMetadataEvent);

    const expectedCredentialMetadataEvent: CIS4.CredentialMetadataEvent = {
        type: CIS4.EventType.CredentialMetadata,
        credentialPubKey: '1'.repeat(64),
        metadataUrl: {
            url: 'https://credential.metadata',
            hash: '0'.repeat(64),
        },
    };
    expect(deserializedCredentialMetadataEvent).toEqual(expectedCredentialMetadataEvent);
});

test('CIS-4 Schema events are deserialized correctly', () => {
    const schemaEvent = {
        Schema: {
            credential_type: 'example',
            schema_ref: {
                url: 'https://schema.ref',
                hash: {
                    Some: ['0'.repeat(64)],
                },
            },
        },
    };
    const serializedSchemaEvent = serializeJSONEvent(schemaEvent);
    const deserializedSchemaEvent = deserializeCIS4Event(serializedSchemaEvent);

    const expectedSchemaEvent: CIS4.CredentialSchemaRefEvent = {
        type: CIS4.EventType.CredentialSchemaRef,
        credentialType: 'example',
        schemaRef: {
            url: 'https://schema.ref',
            hash: '0'.repeat(64),
        },
    };
    expect(deserializedSchemaEvent).toEqual(expectedSchemaEvent);
});

test('CIS-4 RevocationKey events are deserialized correctly', () => {
    const registerRevocationKeyEvent = {
        RevocationKey: {
            key: '1'.repeat(64),
            action: {
                Register: [],
            },
        },
    };
    const serializedRegisterRevocationKeyEvent = serializeJSONEvent(registerRevocationKeyEvent);
    const deserializedRegisterRevocationKeyEvent = deserializeCIS4Event(serializedRegisterRevocationKeyEvent);

    const expectedRegisterRevocationKeyEvent: CIS4.RevocationKeyEvent = {
        type: CIS4.EventType.RevocationKey,
        key: '1'.repeat(64),
        action: CIS4.RevocationKeyAction.Register,
    };
    expect(deserializedRegisterRevocationKeyEvent).toEqual(expectedRegisterRevocationKeyEvent);

    const removeRevocationKeyEvent = {
        RevocationKey: {
            key: '1'.repeat(64),
            action: {
                Remove: [],
            },
        },
    };
    const serializedRemoveRevocationKeyEvent = serializeJSONEvent(removeRevocationKeyEvent);
    const deserializedRemoveRevocationKeyEvent = deserializeCIS4Event(serializedRemoveRevocationKeyEvent);

    const expectedRemoveRevocationKeyEvent: CIS4.RevocationKeyEvent = {
        type: CIS4.EventType.RevocationKey,
        key: '1'.repeat(64),
        action: CIS4.RevocationKeyAction.Remove,
    };
    expect(deserializedRemoveRevocationKeyEvent).toEqual(expectedRemoveRevocationKeyEvent);
});

test('Custom CIS-4 events are deserialized correctly', async () => {
    const data = Uint8Array.from([243, 1, 2, 3]);
    const event = ContractEvent.fromBuffer(data);
    const deserializedCustomEvent = deserializeCIS4Event(event);
    const expectedDeserializedCustomEvent: CIS4.CustomEvent = {
        type: CIS4.EventType.Custom,
        data,
    };
    expect(deserializedCustomEvent).toEqual(expectedDeserializedCustomEvent);
});

test('CIS-4 events are deserialized correctly from a BlockItemSummary', async () => {
    const blockItemSummary = v8.deserialize(
        fs.readFileSync('./test/client/resources/cis4-block-item-summary.bin')
    ) as BlockItemSummary;
    const events = deserializeCIS4EventsFromSummary(blockItemSummary);

    const expectedRegisterEvent: CIS4.RegisterCredentialEvent = {
        type: CIS4.EventType.RegisterCredential,
        credentialPubKey: 'c162a48f58448234da9f3848dc3bc5fd7f2aa0e4b7e5e15654876365f8b86c1b',
        schemaRef: {
            url: 'http://127.0.0.1:8080/json-schemas/JsonSchema2023-telegram.json',
        },
        credentialType: 'Telegram',
        metadataUrl: {
            url: 'http://link/to/schema',
        },
    };
    expect(events).toEqual([expectedRegisterEvent]);
});
