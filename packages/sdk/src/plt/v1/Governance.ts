import { AccountAddress, AccountSigner, TransactionExpiry, TransactionHash } from '../../pub/types.js';
import { governanceTransaction, scaleAmount } from '../Token.js';
import { TokenAmount } from '../index.js';
import { Type as Token } from './Token.js';
import {
    TokenAddAllowListOperation,
    TokenAddDenyListOperation,
    TokenBurnOperation,
    TokenGovernanceOperation,
    TokenMintOperation,
    TokenOperationType,
    TokenRemoveAllowListOperation,
    TokenRemoveDenyListOperation,
    createTokenGovernancePayload,
} from './types.js';

/**
 * Mints a specified amount of tokens.
 *
 * @param {Token} token - The token to mint.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenAmount.Type | TokenAmount.Type[]} amounts - The amount(s) of tokens to mint.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If the token amount is not compatible with the token.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function mint(
    token: Token,
    sender: AccountAddress.Type,
    amounts: TokenAmount.Type | TokenAmount.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5)
): Promise<TransactionHash.Type> {
    const amountsList = [amounts].flat();
    // TODO: re-enable validation when it's covered by unit tests
    // amountsList.forEach((amount) => validateAmount(token, amount));

    const ops: TokenMintOperation[] = amountsList.map((amount) => ({
        [TokenOperationType.Mint]: { amount: scaleAmount(token, amount) },
    }));
    return batchOperations(token, sender, ops, signer, expiry);
}

/**
 * Burns a specified amount of tokens.
 *
 * @param {Token} token - The token to burn.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenAmount.Type | TokenAmount.Type[]} amounts - The amount(s) of tokens to burn.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If the token amount is not compatible with the token.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function burn(
    token: Token,
    sender: AccountAddress.Type,
    amounts: TokenAmount.Type | TokenAmount.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5)
): Promise<TransactionHash.Type> {
    const amountsList = [amounts].flat();
    // TODO: re-enable validation when it's covered by unit tests
    // amountsList.forEach((amount) => validateAmount(token, amount));

    const ops: TokenBurnOperation[] = amountsList.map((amount) => ({
        [TokenOperationType.Burn]: { amount: scaleAmount(token, amount) },
    }));
    return batchOperations(token, sender, ops, signer, expiry);
}

/**
 * Adds an account to the allow list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {AccountAddress.Type | AccountAddress.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function addAllowList(
    token: Token,
    sender: AccountAddress.Type,
    targets: AccountAddress.Type | AccountAddress.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5)
): Promise<TransactionHash.Type> {
    const ops: TokenAddAllowListOperation[] = [targets]
        .flat()
        .map((target) => ({ [TokenOperationType.AddAllowList]: { target } }));
    return batchOperations(token, sender, ops, signer, expiry);
}

/**
 * Removes an account from the allow list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {AccountAddress.Type | AccountAddress.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function removeAllowList(
    token: Token,
    sender: AccountAddress.Type,
    targets: AccountAddress.Type | AccountAddress.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5)
): Promise<TransactionHash.Type> {
    const ops: TokenRemoveAllowListOperation[] = [targets]
        .flat()
        .map((target) => ({ [TokenOperationType.RemoveAllowList]: { target } }));
    return batchOperations(token, sender, ops, signer, expiry);
}

/**
 * Adds an account to the deny list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {AccountAddress.Type | AccountAddress.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function addDenyList(
    token: Token,
    sender: AccountAddress.Type,
    targets: AccountAddress.Type | AccountAddress.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5)
): Promise<TransactionHash.Type> {
    const ops: TokenAddDenyListOperation[] = [targets]
        .flat()
        .map((target) => ({ [TokenOperationType.AddDenyList]: { target } }));
    return batchOperations(token, sender, ops, signer, expiry);
}

/**
 * Removes an account from the deny list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {AccountAddress.Type | AccountAddress.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function removeDenyList(
    token: Token,
    sender: AccountAddress.Type,
    targets: AccountAddress.Type | AccountAddress.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5)
): Promise<TransactionHash.Type> {
    const ops: TokenRemoveDenyListOperation[] = [targets]
        .flat()
        .map((target) => ({ [TokenOperationType.RemoveDenyList]: { target } }));
    return batchOperations(token, sender, ops, signer, expiry);
}

/**
 * Executes a batch of governance operations on a token.
 *
 * @param {Token} token - The token on which to perform the operations.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenGovernanceOperation[]} operations - An array of governance operations to execute.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If a token amount is not compatible with the token.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function batchOperations(
    token: Token,
    sender: AccountAddress.Type,
    operations: TokenGovernanceOperation[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5)
): Promise<TransactionHash.Type> {
    const payload = createTokenGovernancePayload(token.info.id, operations);
    return governanceTransaction(token, sender, payload, signer, expiry);
}
