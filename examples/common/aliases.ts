import { AccountAddress } from '@concordium/node-sdk';

/**
 * The following shows how to generate an account alias, and how to test
 * whether an account is an alias. The alias is an alternative address, which
 * is connected to the same account. The getAlias function takes a counter
 * (0 <= counter < 2^24) to determine which alias to return.
 */

// #region documentation-snippet
const accountAddress = AccountAddress.fromBase58(
    '3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU'
);
const seperateAccount = AccountAddress.fromBase58(
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M'
);

const aliasCounter = 0;
const alias: AccountAddress.Type = AccountAddress.getAlias(
    accountAddress,
    aliasCounter
);

console.log('Original address:', accountAddress.address);
console.log('Alias address:', alias.address);

// The function `isAlias` can be used to check if two acounts are aliases
if (!AccountAddress.isAlias(alias, accountAddress)) {
    throw Error('Expected accounts to be aliases!');
}

// Of course, using `isAlias` on a completely seperate account returns false
if (AccountAddress.isAlias(accountAddress, seperateAccount)) {
    throw Error('Two seperate accounts are claimed to be aliases!');
}
// #endregion documentation-snippet
