import { Buffer } from 'buffer/index.js';
import _JB from 'json-bigint';

import { ConcordiumGRPCClient } from '../../../grpc/index.js';
import { sha256 } from '../../../hash.js';
import { AccountSigner, signTransaction } from '../../../signHelpers.js';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    NextAccountNonce,
    RegisterDataPayload,
} from '../../../types.js';
import { AccountAddress, DataBlob, TransactionExpiry, TransactionHash } from '../../../types/index.js';
import { VerifiablePresentationRequestV1, VerifiablePresentationV1, VerificationAuditRecord } from '../index.js';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

class PrivateVerificationAuditRecord {
    public readonly type = 'ConcordiumVerificationAuditRecord';
    public readonly version = 1;

    constructor(
        public readonly id: string,
        public request: VerifiablePresentationRequestV1.Type,
        public presentation: VerifiablePresentationV1.Type
    ) {}

    public toJSON(): JSON {
        return { ...this, request: this.request.toJSON(), presentation: this.presentation.toJSON() };
    }
}

export type Type = PrivateVerificationAuditRecord;

export type JSON = Pick<Type, 'id' | 'type' | 'version'> & {
    request: VerifiablePresentationRequestV1.JSON;
    presentation: VerifiablePresentationV1.JSON;
};

export function create(
    id: string,
    request: VerifiablePresentationRequestV1.Type,
    presentation: VerifiablePresentationV1.Type
): PrivateVerificationAuditRecord {
    return new PrivateVerificationAuditRecord(id, request, presentation);
}

export function fromJSON(json: JSON): PrivateVerificationAuditRecord {
    return new PrivateVerificationAuditRecord(
        json.id,
        VerifiablePresentationRequestV1.fromJSON(json.request),
        VerifiablePresentationV1.fromJSON(json.presentation)
    );
}

export function toPublic(record: PrivateVerificationAuditRecord, info?: string): VerificationAuditRecord.Type {
    const message = Buffer.from(JSONBig.stringify(record)); // TODO: replace this with proper hashing.. properly from @concordium/rust-bindings
    const hash = Uint8Array.from(sha256([message]));
    return VerificationAuditRecord.create(hash, info);
}

export async function registerPublicRecord(
    privateRecord: PrivateVerificationAuditRecord,
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    info?: string
): Promise<{ publicRecord: VerificationAuditRecord.Type; transactionHash: TransactionHash.Type }> {
    const nextNonce: NextAccountNonce = await grpc.getNextAccountNonce(sender);
    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: nextNonce.nonce,
        sender,
    };

    const publicRecord = toPublic(privateRecord, info);
    const payload: RegisterDataPayload = { data: new DataBlob(VerificationAuditRecord.createAnchor(publicRecord)) };
    const accountTransaction: AccountTransaction = {
        header: header,
        payload,
        type: AccountTransactionType.RegisterData,
    };
    const signature = await signTransaction(accountTransaction, signer);
    const transactionHash = await grpc.sendAccountTransaction(accountTransaction, signature);

    return { publicRecord, transactionHash };
}
