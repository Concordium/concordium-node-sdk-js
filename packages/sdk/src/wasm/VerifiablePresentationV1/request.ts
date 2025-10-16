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
    signTransaction,
} from '../../index.js';
import { DataBlob, TransactionExpiry, TransactionHash } from '../../types/index.js';
import { CredentialStatement } from '../../web3-id/types.js';
import { CredentialContextLabel, GivenContext } from './types.js';

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

export function computeAnchor(context: Context, credentialStatements: CredentialStatement[]): Uint8Array {
    // TODO: this is a quick and dirty anchor implementation that needs to be replaced with
    // the one from concordium-base when available.
    const contextDigest = Buffer.from(JSON.stringify(context));
    const statementsDigest = Buffer.from(JSON.stringify(credentialStatements));
    return sha256([contextDigest, statementsDigest]);
}

// TODO: Should match the w3c spec for a verifiable presentation request and the corresponding
// serde impmlementation in concordium-base
export type JSON = void;

class VerifiablePresentationRequestV1 {
    private readonly type = 'ConcordiumVPRequestV1';

    constructor(
        public readonly context: Context,
        public readonly credentialStatements: CredentialStatement[],
        public readonly transactionRef: TransactionHash.Type // NOTE: renamed from requestTX in ADR
    ) {}

    public toJSON(): JSON {
        throw new Error('not implemented');
    }
}

export type Type = VerifiablePresentationRequestV1;

// TODO: remove when arg is actually used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fromJSON(json: JSON): VerifiablePresentationRequestV1 {
    throw new Error('not implemented');
}

export async function createAndAchor(
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    context: Omit<Context, 'type'>,
    credentialStatements: CredentialStatement[]
): Promise<VerifiablePresentationRequestV1> {
    const requestContext = createContext(context);
    const anchor = computeAnchor(requestContext, credentialStatements);

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
