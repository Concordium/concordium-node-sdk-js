import { AccountAddress, TransactionHash } from '../../pub/types.js';
import { validateAmount } from '../Token.js';
import { TokenAmount } from '../index.js';
import { Type as Token } from './Token.js';
import { TokenGovernanceOperation } from './types.js';

/**
 * Mints a specified amount of tokens.
 *
 * @param token - The token to mint.
 * @param sender - The account address of the sender.
 * @param amount - The amount of tokens to mint.
 * @returns A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If the token amount is not compatible with the token.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function mint(
    token: Token,
    sender: AccountAddress.Type,
    amount: TokenAmount.Type
): Promise<TransactionHash.Type> {
    validateAmount(token, amount);
    throw new Error('Not implemented...');
}

/**
 * Burns a specified amount of tokens.
 *
 * @param token - The token to burn.
 * @param sender - The account address of the sender.
 * @param amount - The amount of tokens to burn.
 * @returns A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If the token amount is not compatible with the token.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function burn(
    token: Token,
    sender: AccountAddress.Type,
    amount: TokenAmount.Type
): Promise<TransactionHash.Type> {
    validateAmount(token, amount);
    throw new Error('Not implemented...');
}

/**
 * Adds an account to the allow list of a token.
 *
 * @param token - The token for which to add the allow list entry.
 * @param sender - The account address of the sender.
 * @param target - The account address to be added to the allow list.
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function addAllowList(
    token: Token,
    sender: AccountAddress.Type,
    target: AccountAddress.Type
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}

/**
 * Removes an account from the allow list of a token.
 *
 * @param token - The token for which to remove the allow list entry.
 * @param sender - The account address of the sender.
 * @param target - The account address to be removed from the allow list.
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function removeAllowList(
    token: Token,
    sender: AccountAddress.Type,
    target: AccountAddress.Type
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}

/**
 * Adds an account to the deny list of a token.
 *
 * @param token - The token for which to add the deny list entry.
 * @param sender - The account address of the sender.
 * @param target - The account address to be added to the deny list.
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function addDenyList(
    token: Token,
    sender: AccountAddress.Type,
    target: AccountAddress.Type
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}

/**
 * Removes an account from the deny list of a token.
 *
 * @param token - The token for which to remove the deny list entry.
 * @param sender - The account address of the sender.
 * @param target - The account address to be removed from the deny list.
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function removeDenyList(
    token: Token,
    sender: AccountAddress.Type,
    target: AccountAddress.Type
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}

/**
 * Executes a batch of governance operations on a token.
 *
 * @param token - The token on which to perform the operations.
 * @param sender - The account address of the sender.
 * @param operations - An array of governance operations to execute.
 * @returns A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If a token amount is not compatible with the token.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export async function batchOperations(
    token: Token,
    sender: AccountAddress.Type,
    operations: TokenGovernanceOperation[]
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}
