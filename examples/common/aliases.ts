import { AccountAddress, getAlias, isAlias } from '@concordium/node-sdk';

/**
 * The following shows how to generate an account alias, and how to test
 * whether an account is an alias. The alias is an alternative address, which
 * is connected to the same account. The getAlias function takes a counter
 * (0 <= counter < 2^24) to determine which alias to return.
 */

const accountAddress = new AccountAddress(
    '3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU'
);
const anotherAccount = new AccountAddress(
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M'
);

console.log('Original address:', accountAddress.address, '\n');

console.log('Generating aliases:');
const aliases: AccountAddress[] = [];
for (let i = 0; i < 5; i++) {
    aliases.push(getAlias(accountAddress, i));
    console.log('Alias ' + (i + 1) + ':', aliases[i].address);
}

// Every alias is an alias of the original account and of each other
for (let i = 0; i < aliases.length; i++) {
    for (let j = 0; j < aliases.length; j++) {
        if (
            !isAlias(aliases[i], aliases[j]) &&
            !isAlias(aliases[i], accountAddress)
        ) {
            throw Error('Expected accounts to be aliases!');
        }
    }
}

// Of course, using isAlias() on a completely seperate account returns false
if (isAlias(accountAddress, anotherAccount)) {
    throw Error('Two seperate accounts is claimed to be aliases!');
}
