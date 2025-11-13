import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    CcdAmount,
    ContractContext,
    ContractName,
    Energy,
    EntrypointName,
    InitContractPayload,
    ModuleReference,
    ReceiveName,
    ReturnValue,
    TransactionExpiry,
    UpdateContractPayload,
    affectedContracts,
    buildAccountSigner,
    deserializeReceiveReturnValue,
    isKnown,
    knownOrError,
    parseWallet,
    serializeInitContractParameters,
    serializeUpdateContractParameters,
    signTransaction,
    unwrap,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import { readFileSync } from 'node:fs';

import { parseEndpoint } from '../shared/util.js';

import { getAccountTransactionHandler } from '@concordium/web-sdk';

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
const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * The following example demonstrates how a smart contract can be initialized
 * and updated.
 */

(async () => {
    const sunnyWeather = { Sunny: [] };
    const rainyWeather = { Rainy: [] };

    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const wallet = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(wallet.value.address);
    const signer = buildAccountSigner(wallet);

    const moduleRef = ModuleReference.fromHexString('44434352ddba724930d6b1b09cd58bd1fba6ad9714cf519566d5fe72d80da0d1');
    const maxCost = Energy.create(30000);
    const contractName = ContractName.fromStringUnchecked('weather');
    const receiveName = ReceiveName.fromStringUnchecked('weather.set');
    const schema = await client.getEmbeddedSchema(moduleRef);

    // --- Initialize Contract --- //

    console.log('\n## Initializing weather contract with sunny weather\n');

    // #region documentation-snippet-init-contract

    const initHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender,
    };

    const initParams = serializeInitContractParameters(contractName, sunnyWeather, schema!.buffer);

    const initPayload: InitContractPayload = {
        amount: CcdAmount.zero(),
        moduleRef: moduleRef,
        initName: contractName,
        param: initParams,
        maxContractExecutionEnergy: maxCost,
    };

    const handler = getAccountTransactionHandler(AccountTransactionType.InitContract);
    const initTransaction = handler.create(initHeader, initPayload);

    const initSignature = await signTransaction(initTransaction, signer);
    const initTrxHash = await client.sendAccountTransaction(initTransaction, initSignature);

    console.log('Transaction submitted, waiting for finalization...');

    const initStatus = await client.waitForTransactionFinalization(initTrxHash);
    console.dir(initStatus, { depth: null, colors: true });

    if (!isKnown(initStatus.summary)) {
        throw new Error('Unexpected transaction outcome');
    }

    const contractAddress = knownOrError(
        affectedContracts(initStatus.summary)[0],
        'Expected contract init event to be known'
    );

    // #endregion documentation-snippet-init-contract

    // --- Checking weather --- //

    await checkWeather();

    // --- Update smart contract --- //

    console.log('## Making it rain with weather.set\n');

    // #region documentation-snippet-update-contract

    const updateHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender,
    };

    const updateParams = serializeUpdateContractParameters(
        contractName,
        EntrypointName.fromString('set'),
        rainyWeather,
        schema!.buffer
    );

    const updatePayload: UpdateContractPayload = {
        amount: CcdAmount.zero(),
        address: unwrap(contractAddress),
        receiveName,
        message: updateParams,
    };

    const updateHandler = getAccountTransactionHandler(AccountTransactionType.Update);
    const updateTransaction = updateHandler.create(updateHeader, updatePayload, maxCost);  //using maxCost constant here supplied in beginning of function

    const updateSignature = await signTransaction(updateTransaction, signer);
    const updateTrxHash = await client.sendAccountTransaction(updateTransaction, updateSignature);

    console.log('Transaction submitted, waiting for finalization...');

    const updateStatus = await client.waitForTransactionFinalization(updateTrxHash);
    console.dir(updateStatus, { depth: null, colors: true });

    // #endregion documentation-snippet-update-contract

    // --- Checking Weather --- //

    await checkWeather();

    // Helper function for checking weather
    async function checkWeather() {
        const contextPostInit: ContractContext = {
            contract: unwrap(contractAddress),
            invoker: sender,
            method: ReceiveName.fromString('weather.get'),
        };

        const invokedPostInit = await client.invokeContract(contextPostInit);

        if (invokedPostInit.tag === 'success') {
            const rawReturnValue = unwrap(invokedPostInit.returnValue);
            const returnValue = deserializeReceiveReturnValue(
                ReturnValue.toBuffer(rawReturnValue),
                schema!.buffer,
                contractName,
                EntrypointName.fromString('get')
            );
            console.log('\nThe weather is now:');
            console.dir(returnValue, { depth: null, colors: true });
            console.log('');
        }
    }
})();
