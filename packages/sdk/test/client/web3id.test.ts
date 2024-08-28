import {
    BlockHash,
    VerifiablePresentation,
    Web3IdProofRequest,
    getPublicData,
    verifyPresentation,
} from '../../src/index.ts';
import { testEnvironment } from '../globals.ts';
import { getNodeClientV2, getNodeClientWeb } from './testHelpers.ts';

const clientV2 = getNodeClientV2();
const clientWeb = getNodeClientWeb();
const clients = testEnvironment === 'node' ? [clientV2, clientWeb] : [clientWeb];
const BLOCK_HASH = BlockHash.fromHexString('4b39f8206c7c24fe3644ede737801c25616a6f601f42ae0e9dca3962c412003b');

const PRESENTATION = VerifiablePresentation.fromString(`{
    "presentationContext": "d7bce30c25cad255a30b8bc72a7d4ee654d2d1e0fa4342fde1e453c034e9afa7",
    "proof": {
        "created": "2024-05-10T06:57:45.005Z",
        "proofValue": [
            "08a6bc326070d685fcd11f9ccf81a50c75f76a787bdf3dc1e9246c46783e249f2e539338ac5d1c511fb98e6e14b5174f19e3dbf9a477398868d7d74482ad9f05"
        ],
        "type": "ConcordiumWeakLinkingProofV1"
    },
    "type": "VerifiablePresentation",
    "verifiableCredential": [
        {
            "credentialSubject": {
                "id": "did:ccd:testnet:pkc:70159fe625e369b05c09294692088174dbc5df15b78ebd6722e5cac6f6b93052",
                "proof": {
                    "commitments": {
                        "commitments": {
                            "userId": "8b98cc0f223b69c63d10ca4edd2021c83a092893407652ad095aa65e4ffcbd9738448f64c3b0a62f7e7adfa57ba7e641",
                            "username": "8ae284303ca77dda87cc17bed0b6b4aaba28fe6f1783909a22d887624f3502a42affd545a7cf15f5c3c06f6734b158d5"
                        },
                        "signature": "a32b1e81611650cebfcb1da1cb08ddadf817f33bef7379ec8cf694cf36fc585315d96f7c8d0efe62cd7f69ec6f824fa421a81747f3bdf9a61af9d15bcfdbba0f"
                    },
                    "created": "2024-05-10T06:57:45.001Z",
                    "proofValue": [
                        {
                            "attribute": "6521470895",
                            "proof": "d72775bcd3a7aad3e8cd021c913acd21bb171d8e20e6252f99bbca7c39724ab02ea90dd4b8d4795c64ea7490a37426cca7088698f22964b84f35cb80fabc6a2b",
                            "type": "RevealAttribute"
                        },
                        {
                            "attribute": "sorenbz",
                            "proof": "2e7e599dfa5eba3ed58dd8bb98f1bcd3f390059a6426a757cb079c0594dca86428191e4f60ed20bb4c498750af17ca621e1401c0ecd195f5ee4ecc52cc9f6dc5",
                            "type": "RevealAttribute"
                        }
                    ],
                    "type": "ConcordiumZKProofV3"
                },
                "statement": [
                    {
                        "attributeTag": "userId",
                        "type": "RevealAttribute"
                    },
                    {
                        "attributeTag": "username",
                        "type": "RevealAttribute"
                    }
                ]
            },
            "issuer": "did:ccd:testnet:sci:6260:0/issuer",
            "type": [
                "ConcordiumVerifiableCredential",
                "SoMeCredential",
                "VerifiableCredential"
            ]
        },
        {
            "credentialSubject": {
                "id": "did:ccd:testnet:cred:9549a7e0894fe888a68019e31db5a99a21c9b14cca0513934e9951057c96434a86dd54f90ff2bf18b99dad5ec64d7563",
                "proof": {
                    "created": "2024-05-10T06:57:45.005Z",
                    "proofValue": [
                        {
                            "attribute": "John",
                            "proof": "3008e5d80469197adb9537cd6f0390351b9151fb3be57cfeceafdb9969d88da647141e3e24d1d9c821559d63aec12195512b4b2704460e152a3887828b77744c",
                            "type": "RevealAttribute"
                        },
                        {
                            "attribute": "Doe",
                            "proof": "91cebc7d0466b5c569b1c014f86f82cd3a637aa8debeaaf95a8a098cc3d585c43881998a252288761127325278ac275a77b844a3775edc159cf2d90cf0c96a71",
                            "type": "RevealAttribute"
                        }
                    ],
                    "type": "ConcordiumZKProofV3"
                },
                "statement": [
                    {
                        "attributeTag": "firstName",
                        "type": "RevealAttribute"
                    },
                    {
                        "attributeTag": "lastName",
                        "type": "RevealAttribute"
                    }
                ]
            },
            "issuer": "did:ccd:testnet:idp:0",
            "type": [
                "VerifiableCredential",
                "ConcordiumVerifiableCredential"
            ]
        }
    ]
}`);

test.each(clients)('verifyPresentation', async (client) => {
    const context = await client.getCryptographicParameters(BLOCK_HASH);
    const data = await getPublicData(client, 'Testnet', PRESENTATION, BLOCK_HASH);
    const request = verifyPresentation(
        PRESENTATION,
        context,
        data.map((d) => d.inputs)
    );
    const expected: Web3IdProofRequest = {
        challenge: 'd7bce30c25cad255a30b8bc72a7d4ee654d2d1e0fa4342fde1e453c034e9afa7',
        credentialStatements: [
            {
                id: 'did:ccd:testnet:sci:6260:0/credentialEntry/70159fe625e369b05c09294692088174dbc5df15b78ebd6722e5cac6f6b93052',
                statement: [
                    { attributeTag: 'userId', type: 'RevealAttribute' },
                    { attributeTag: 'username', type: 'RevealAttribute' },
                ],
                type: ['ConcordiumVerifiableCredential', 'SoMeCredential', 'VerifiableCredential'],
            },
            {
                id: 'did:ccd:testnet:cred:9549a7e0894fe888a68019e31db5a99a21c9b14cca0513934e9951057c96434a86dd54f90ff2bf18b99dad5ec64d7563',
                statement: [
                    { attributeTag: 'firstName', type: 'RevealAttribute' },
                    { attributeTag: 'lastName', type: 'RevealAttribute' },
                ],
            },
        ],
    };
    expect(request).toEqual(expected);
});
