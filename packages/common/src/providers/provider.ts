import {
    AccountTransaction,
    AccountTransactionSignature,
    NextAccountNonce,
    TransactionStatus,
} from '../types';
import { AccountAddress } from '../types/accountAddress';

export default interface ConcordiumNodeProvider {
    getNextAccountNonce(
        accountAddress: AccountAddress
    ): Promise<NextAccountNonce | undefined>;
    getTransactionStatus(
        transactionHash: string
    ): Promise<TransactionStatus | undefined>;
    sendAccountTransaction(
        accountTransaction: AccountTransaction,
        signatures: AccountTransactionSignature
    ): Promise<boolean>;
}
