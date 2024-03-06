import { CIS4, deserializeCIS4Event } from '../../src/cis4/util.ts';
import {
    SchemaEnumVariant,
    SchemaType,
    serializeSchemaType,
} from '../../src/schemaTypes.js';
import * as ContractEvent from '../../src/types/ContractEvent.js';
import * as wasm from '@concordium/rust-bindings';
import JSONbig from 'json-bigint';

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

test('CIS4 Register events are deserialized correctly', () => {
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
    const deserializedRegisterEvent = deserializeCIS4Event(
        serializedRegisterEvent
    );

    const expectedRegisterEvent: CIS4.RegisterCredentialEvent = {
        type: CIS4.EventType.RegisterCredential,
        credentialPubKey: '1'.repeat(64),
        schemaRef: {
            url: 'https://schema.ref',
        },
        credentialType: 'example',
    };
    expect(deserializedRegisterEvent).toEqual(expectedRegisterEvent);
});
