import { AccountTransactionHeader, Base58String } from '../../index.js';
import { AccountAddress, Energy, SequenceNumber, TransactionExpiry } from '../../types/index.js';
import { orUndefined } from '../../util.js';
import { Payload } from '../index.js';

export type HeaderJSON = {
    sender?: Base58String;
    nonce?: bigint;
    expiry?: number;
    executionEnergyAmount: bigint;
    numSignatures?: number;
};

/**
 * Transaction header for the intermediary state of account transactions, i.e. prior to being signing.
 */
export type Header = Partial<AccountTransactionHeader> & {
    /** a base energy amount, this amount excludes transaction size and signature costs */
    executionEnergyAmount: Energy.Type;
    /** The number of signatures the transaction can hold. If `undefined`, this will be defined at the time of signing. */
    numSignatures?: bigint;
    sponsor?: SponsorDetails;
};

type SponsorDetails = {
    account: AccountAddress.Type;
    /** The number of signatures the transaction can hold. */
    numSignatures: bigint;
};

export function headerToJSON(header: Header): HeaderJSON {
    const json: HeaderJSON = {
        sender: header.sender?.toJSON(),
        nonce: header.nonce?.toJSON(),
        expiry: header.expiry?.toJSON(),
        executionEnergyAmount: header.executionEnergyAmount.value,
    };

    if (header.numSignatures !== undefined) {
        json.numSignatures = Number(header.numSignatures);
    }
    return json;
}

export function headerFromJSON(json: HeaderJSON): Header {
    return {
        sender: orUndefined(AccountAddress.fromJSON)(json.sender),
        nonce: orUndefined(SequenceNumber.fromJSON)(json.nonce),
        expiry: orUndefined(TransactionExpiry.fromJSON)(json.expiry),
        executionEnergyAmount: Energy.create(json.executionEnergyAmount),
        numSignatures: orUndefined(BigInt)(json.numSignatures),
    };
}
