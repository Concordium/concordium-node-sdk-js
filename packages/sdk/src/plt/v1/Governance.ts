import { AccountAddress, TransactionHash } from '../../types.js';
import { TokenAmount } from '../types.js';
import { Type as Token } from './TokenClient.js';

export async function mint(
    token: Token,
    sender: AccountAddress.Type,
    amount: TokenAmount.Type
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}

export async function burn(
    token: Token,
    sender: AccountAddress.Type,
    amount: TokenAmount.Type
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}

export async function addAllowList(
    token: Token,
    sender: AccountAddress.Type,
    target: AccountAddress.Type
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}

export async function removeAllowList(
    token: Token,
    sender: AccountAddress.Type,
    target: AccountAddress.Type
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}

export async function addDenyList(
    token: Token,
    sender: AccountAddress.Type,
    target: AccountAddress.Type
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}

export async function removeDenyList(
    token: Token,
    sender: AccountAddress.Type,
    target: AccountAddress.Type
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}
