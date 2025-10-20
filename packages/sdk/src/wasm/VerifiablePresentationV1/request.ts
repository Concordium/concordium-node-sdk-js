import { Buffer } from 'buffer/index.js';
import _JB from 'json-bigint';

import { sha256 } from '../../hash.js';
import {
    AccountAddress,
    AccountSigner,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    ConcordiumGRPCClient,
    NextAccountNonce,
    RegisterDataPayload,
    cborDecode,
    cborEncode,
    signTransaction,
} from '../../index.js';
import { ContractAddress, DataBlob, TransactionExpiry, TransactionHash } from '../../types/index.js';
import { CredentialStatement, StatementProverQualifier } from '../../web3-id/types.js';
import { GivenContextJSON, givenContextFromJSON, givenContextToJSON } from './internal.js';
import { CredentialContextLabel, GivenContext } from './types.js';

const JSONBig = _JB({ useNativeBigInt: true, alwaysParseAsBig: true });

// NOTE: renamed from ContextInformation in ADR
export type Context = {
    type: 'ConcordiumContextInformationV1';
    given: GivenContext[];
    requested: CredentialContextLabel[];
};

export function createContext(context: Omit<Context, 'type'>): Context {
    return { type: 'ConcordiumContextInformationV1', ...context };
}

export function createSimpleContext(nonce: Uint8Array, connectionId: string, contextString: string): Context {
    return createContext({
        given: [
            { label: 'Nonce', context: nonce },
            { label: 'ConnectionID', context: connectionId },
            { label: 'ContextString', context: contextString },
        ],
        requested: ['BlockHash', 'ResourceID'],
    });
}

export type AnchorData = {
    type: 'CCDVRA';
    version: number;
    hash: Uint8Array;
    public?: Record<string, any>;
};

export function createAnchor(
    context: Context,
    credentialStatements: CredentialStatement[],
    publicInfo?: Record<string, any>
): Uint8Array {
    const hash = computeAnchorHash(context, credentialStatements);
    const data: AnchorData = { type: 'CCDVRA', version: 1, hash, public: publicInfo };
    return cborEncode(data);
}

export function computeAnchorHash(context: Context, credentialStatements: CredentialStatement[]): Uint8Array {
    // TODO: this is a quick and dirty anchor implementation that needs to be replaced with
    // proper serialization, which is TBD.
    const contextDigest = Buffer.from(JSON.stringify(context));
    const statementsDigest = Buffer.from(JSONBig.stringify(credentialStatements));
    return Uint8Array.from(sha256([contextDigest, statementsDigest]));
}

export function decodeAnchor(cbor: Uint8Array): AnchorData {
    const value = cborDecode(cbor);
    if (typeof value !== 'object' || value === null) throw new Error('Expected a cbor encoded object');
    // required fields
    if (!('type' in value) || value.type !== 'CCDVRA') throw new Error('Expected "type" to be "CCDVRA"');
    if (!('version' in value) || typeof value.version !== 'number')
        throw new Error('Expected "version" to be a number');
    if (!('hash' in value) || !(value.hash instanceof Uint8Array))
        throw new Error('Expected "hash" to be a Uint8Array');
    // optional fields
    if ('public' in value && typeof value.public !== 'object') throw new Error('Expected "public" to be an object');
    return value as AnchorData;
}

// TODO: Should match the w3c spec for a verifiable presentation request and the corresponding
// serde impmlementation in concordium-base
export type JSON = {
    requestContext: Pick<Context, 'type' | 'requested'> & { given: GivenContextJSON[] };
    credentialStatements: CredentialStatement[];
    transactionRef: TransactionHash.JSON;
};

class VerifiablePresentationRequestV1 {
    private readonly type = 'ConcordiumVPRequestV1';

    constructor(
        public readonly requestContext: Context,
        public readonly credentialStatements: CredentialStatement[],
        public readonly transactionRef: TransactionHash.Type // NOTE: renamed from requestTX in ADR
    ) {}

    public toJSON(): JSON {
        return {
            requestContext: { ...this.requestContext, given: this.requestContext.given.map(givenContextToJSON) },
            credentialStatements: this.credentialStatements,
            transactionRef: this.transactionRef.toJSON(),
        };
    }
}

export type Type = VerifiablePresentationRequestV1;

export function fromJSON(json: JSON): VerifiablePresentationRequestV1 {
    const requestContext = { ...json.requestContext, given: json.requestContext.given.map(givenContextFromJSON) };
    const statements: CredentialStatement[] = json.credentialStatements.map(({ statement, idQualifier }) => {
        let mappedQualifier: StatementProverQualifier;
        switch (idQualifier.type) {
            case 'id':
                mappedQualifier = { type: 'id', issuers: idQualifier.issuers.map(Number) };
                break;
            case 'cred':
                mappedQualifier = { type: 'cred', issuers: idQualifier.issuers.map(Number) };
                break;
            case 'sci':
                mappedQualifier = {
                    type: 'sci',
                    issuers: idQualifier.issuers.map((c) => ContractAddress.create(c.index, c.subindex)),
                };
                break;
            default:
                mappedQualifier = idQualifier;
        }
        return { statement, idQualifier: mappedQualifier } as CredentialStatement;
    });

    return new VerifiablePresentationRequestV1(
        requestContext,
        statements,
        TransactionHash.fromJSON(json.transactionRef)
    );
}

export async function createAndAchor(
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    context: Omit<Context, 'type'>,
    credentialStatements: CredentialStatement[],
    anchorPublicInfo?: Record<string, any>
): Promise<VerifiablePresentationRequestV1> {
    const requestContext = createContext(context);
    const anchor = createAnchor(requestContext, credentialStatements, anchorPublicInfo);

    const nextNonce: NextAccountNonce = await grpc.getNextAccountNonce(sender);
    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: nextNonce.nonce,
        sender,
    };
    const payload: RegisterDataPayload = { data: new DataBlob(anchor) };
    const accountTransaction: AccountTransaction = {
        header: header,
        payload,
        type: AccountTransactionType.RegisterData,
    };
    const signature = await signTransaction(accountTransaction, signer);
    const transactionHash = await grpc.sendAccountTransaction(accountTransaction, signature);

    return create(requestContext, credentialStatements, transactionHash);
}

export function create(
    context: Context,
    credentialStatements: CredentialStatement[],
    transactionRef: TransactionHash.Type
): VerifiablePresentationRequestV1 {
    return new VerifiablePresentationRequestV1(context, credentialStatements, transactionRef);
}
