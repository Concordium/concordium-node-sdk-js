import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    CcdAmount,
    ContractContext,
    createConcordiumClient,
    deserializeReceiveReturnValue,
    InitContractPayload,
    ModuleReference,
    serializeInitContractParameters,
    serializeUpdateContractParameters,
    signTransaction,
    TransactionExpiry,
    UpdateContractPayload,
    unwrap,
    parseWallet,
    buildAccountSigner,
    affectedContracts,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';
import { Buffer } from 'buffer/index.js';
import { parseEndpoint } from '../shared/util';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --wallet-file, -w  A path to a wallet export file from a Concordium wallet

  Options
    --help,     -h  Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            walletFile: {
                type: 'string',
                alias: 'w',
                isRequired: true,
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * The following example demonstrates how a smart contract can be initialized
 * and updated.
 */

(async () => {
    const sunnyWeather = { Sunny: [] };
    const rainyWeather = { Rainy: [] };

    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const wallet = parseWallet(walletFile);
    const sender = new AccountAddress(wallet.value.address);
    const signer = buildAccountSigner(wallet);

    const moduleRef = new ModuleReference(
        '44434352ddba724930d6b1b09cd58bd1fba6ad9714cf519566d5fe72d80da0d1'
    );
    const maxCost = 30000n;
    const contractName = 'weather';
    const receiveName = 'weather.set';
    const schema = await client.getEmbeddedSchema(moduleRef);

    // --- Initialize Contract --- //

    console.log('\n## Initializing weather contract with sunny weather\n');

    // #region documentation-snippet-init-contract

    const initHeader: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender,
    };

    const initParams = serializeInitContractParameters(
        contractName,
        sunnyWeather,
        schema
    );

    const initPayload: InitContractPayload = {
        amount: new CcdAmount(0n),
        moduleRef: moduleRef,
        initName: contractName,
        param: initParams,
        maxContractExecutionEnergy: maxCost,
    };

    const initTransaction: AccountTransaction = {
        header: initHeader,
        payload: initPayload,
        type: AccountTransactionType.InitContract,
    };

    const initSignature = await signTransaction(initTransaction, signer);
    const initTrxHash = await client.sendAccountTransaction(
        initTransaction,
        initSignature
    );

    console.log('Transaction submitted, waiting for finalization...');
    const initStatus = await client.waitForTransactionFinalization(initTrxHash);

    // #endregion documentation-snippet-init-contract

    // --- Checking weather --- //

    const contractAddress = affectedContracts(initStatus.summary)[0];

    const contextPostInit: ContractContext = {
        contract: unwrap(contractAddress),
        invoker: sender,
        method: 'weather.get',
    };

    const invokedPostInit = await client.invokeContract(contextPostInit);

    if (invokedPostInit.tag === 'success') {
        const rawReturnValue = Buffer.from(
            unwrap(invokedPostInit.returnValue),
            'hex'
        );
        const returnValue = deserializeReceiveReturnValue(
            rawReturnValue,
            schema,
            contractName,
            'get'
        );
        console.log('\nThe weather is now:');
        console.dir(returnValue, { depth: null, colors: true });
        console.log('');
    }

    // --- Update smart contract --- //

    console.log('## Making it rain with weather.set\n');

    // #region documentation-snippet-update-contract

    const updateHeader: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender,
    };

    const updateParams = serializeUpdateContractParameters(
        contractName,
        'set',
        rainyWeather,
        schema
    );

    const updatePayload: UpdateContractPayload = {
        amount: new CcdAmount(0n),
        address: unwrap(contractAddress),
        receiveName,
        message: updateParams,
        maxContractExecutionEnergy: maxCost,
    };

    const updateTransaction: AccountTransaction = {
        header: updateHeader,
        payload: updatePayload,
        type: AccountTransactionType.Update,
    };

    const updateSignature = await signTransaction(updateTransaction, signer);
    const updateTrxHash = await client.sendAccountTransaction(
        updateTransaction,
        updateSignature
    );

    console.log('Transaction submitted, waiting for finalization...');

    const updateStatus = await client.waitForTransactionFinalization(
        updateTrxHash
    );
    console.dir(updateStatus, { depth: null, colors: true });

    // #region documentation-snippet-update-contract

    // --- Checking Weather --- //

    const contextPostUpdate: ContractContext = {
        contract: unwrap(contractAddress),
        invoker: sender,
        method: 'weather.get',
    };

    const invokedPostUpdate = await client.invokeContract(contextPostUpdate);
    if (invokedPostUpdate.tag === 'success') {
        const rawReturnValue = Buffer.from(
            unwrap(invokedPostUpdate.returnValue),
            'hex'
        );
        const returnValue = deserializeReceiveReturnValue(
            rawReturnValue,
            schema,
            contractName,
            'get'
        );
        console.log('\nThe weather is now:');
        console.dir(returnValue, { depth: null, colors: true });
        console.log('');
    }
})();
