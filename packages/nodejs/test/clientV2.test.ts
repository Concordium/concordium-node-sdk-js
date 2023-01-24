import { credentials, Metadata } from '@grpc/grpc-js/';
import * as v1 from '@concordium/common-sdk';
import * as v2 from '../grpc/v2/concordium/types';
import ConcordiumNodeClientV1 from '../src/client';
import ConcordiumNodeClientV2 from '../src/clientV2';
import { testnetBulletproofGenerators } from './resources/bulletproofgenerators';
import { getAccountIdentifierInput, getBlockHashInput } from '../src/util';
import {
    buildBasicAccountSigner,
    calculateEnergyCost,
    createCredentialDeploymentTransaction,
    getAccountTransactionHandler,
    sha256,
    signTransaction,
} from '@concordium/common-sdk';
import { serializeAccountTransactionPayload } from '@concordium/common-sdk/src';
import {
    getCredentialDeploymentSignDigest,
    serializeAccountTransaction,
} from '@concordium/common-sdk/lib/serialization';
import { getModuleBuffer, getIdentityInput } from './testHelpers';
import * as ed from '@noble/ed25519';
import * as expected from './resources/expectedJsons';

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClientV2(
    address = 'service.internal.testnet.concordium.com',
    port = 20000
): ConcordiumNodeClientV2 {
    const metadata = new Metadata();
    return new ConcordiumNodeClientV2(
        address,
        port,
        credentials.createInsecure(),
        metadata,
        15000
    );
}

export function getNodeClientV1(
    address = 'service.internal.testnet.concordium.com'
): ConcordiumNodeClientV1 {
    const metadata = new Metadata();
    metadata.add('authentication', 'rpcadmin');
    return new ConcordiumNodeClientV1(
        address,
        10000,
        credentials.createInsecure(),
        metadata,
        15000
    );
}

const clientV1 = getNodeClientV1();
const clientV2 = getNodeClientV2();

const testAccount = new v1.AccountAddress(
    '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'
);
const testCredId = new v1.CredentialRegistrationId(
    'aa730045bcd20bb5c24349db29d949f767e72f7cce459dc163c4b93c780a7d7f65801dda8ff7e4fc06fdf1a1b246276f'
);
const testAccBaker = new v1.AccountAddress(
    '4EJJ1hVhbVZT2sR9xPzWUwFcJWK3fPX54z94zskTozFVk8Xd4L'
);
const testAccDeleg = new v1.AccountAddress(
    '3bFo43GiPnkk5MmaSdsRVboaX2DNSKaRkLseQbyB3WPW1osPwh'
);
const testBlockHash =
    'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';

// Retrieves the account info for the given account in the GRPCv2 type format.
function getAccountInfoV2(
    client: ConcordiumNodeClientV2,
    accountIdentifier: v1.AccountIdentifierInput
): Promise<v2.AccountInfo> {
    const accountInfoRequest = {
        blockHash: getBlockHashInput(testBlockHash),
        accountIdentifier: getAccountIdentifierInput(accountIdentifier),
    };

    return client.client.getAccountInfo(accountInfoRequest).response;
}

test('getCryptographicParameters', async () => {
    const parameters = await clientV2.getCryptographicParameters(testBlockHash);
    expect(parameters.genesisString).toEqual('Concordium Testnet Version 5');
    expect(parameters.onChainCommitmentKey).toEqual(
        'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8d45e64b6f917c540eee16c970c3d4b7f3caf48a7746284878e2ace21c82ea44bf84609834625be1f309988ac523fac'
    );

    expect(parameters.bulletproofGenerators).toEqual(
        Buffer.from(testnetBulletproofGenerators, 'base64').toString('hex')
    );
});

test('NextAccountSequenceNumber', async () => {
    const nan = await clientV2.getNextAccountNonce(testAccount);
    expect(nan.nonce).toBeGreaterThanOrEqual(19n);
    expect(nan.allFinal).toBeDefined();
});

test('getAccountInfo', async () => {
    const accountInfo = await getAccountInfoV2(clientV2, testAccount);

    expect(v2.AccountInfo.toJson(accountInfo)).toEqual(expected.accountInfo);
});

test('getAccountInfo: Invalid hash throws error', async () => {
    const invalidBlockHash = '1010101010';
    await expect(
        clientV2.getAccountInfo(testAccount, invalidBlockHash)
    ).rejects.toEqual(
        new Error(
            'The input was not a valid hash, must be 32 bytes: ' +
                invalidBlockHash
        )
    );
});

test('getAccountInfo for baker', async () => {
    const accInfo = await getAccountInfoV2(clientV2, testAccBaker);
    const accountIndexInfo = await getAccountInfoV2(clientV2, 5n);

    if (accInfo.stake && accountIndexInfo.stake) {
        const stake = v2.AccountStakingInfo.toJson(accInfo.stake);
        const stakeAccountIndex = v2.AccountStakingInfo.toJson(
            accountIndexInfo.stake
        );
        expect(stake).toEqual(expected.stakingInfoBaker);
        expect(stake).toEqual(stakeAccountIndex);
    } else {
        throw Error('Stake field not found in accountInfo.');
    }
});

test('getAccountInfo for delegator', async () => {
    const accInfo = await getAccountInfoV2(clientV2, testAccDeleg);

    if (accInfo.stake) {
        expect(v2.AccountStakingInfo.toJson(accInfo.stake)).toEqual(
            expected.stakingInfoDelegator
        );
    } else {
        throw Error('Stake field not found in accountInfo.');
    }
});

test('getAccountInfo: Account Address and CredentialRegistrationId is equal', async () => {
    const accInfo = await clientV2.getAccountInfo(testAccount, testBlockHash);
    const credIdInfo = await clientV2.getAccountInfo(testCredId, testBlockHash);

    expect(accInfo).toEqual(credIdInfo);
});

test('accountInfo implementations is the same', async () => {
    const oldReg = await clientV1.getAccountInfo(testAccount, testBlockHash);
    const newReg = await clientV2.getAccountInfo(testAccount, testBlockHash);

    const oldCredId = await clientV1.getAccountInfo(testCredId, testBlockHash);
    const newCredId = await clientV2.getAccountInfo(testCredId, testBlockHash);

    const oldBaker = await clientV1.getAccountInfo(testAccBaker, testBlockHash);
    const newBaker = await clientV2.getAccountInfo(testAccBaker, testBlockHash);

    const oldDeleg = await clientV1.getAccountInfo(testAccDeleg, testBlockHash);
    const newDeleg = await clientV2.getAccountInfo(testAccDeleg, testBlockHash);

    expect(oldReg).toEqual(newReg);
    expect(oldCredId).toEqual(newCredId);
    expect(oldDeleg).toEqual(newDeleg);
    expect(oldBaker).toEqual(newBaker);
});

test('getBlockItemStatus on chain update', async () => {
    const transactionHash =
        '3de823b876d05cdd33a311a0f84124079f5f677afb2534c4943f830593edc650';
    const blockItemStatus = await clientV2.getBlockItemStatus(transactionHash);

    expect(blockItemStatus).toEqual(expected.blockItemStatusUpdate);
});

test('getBlockItemStatus on simple transfer', async () => {
    const transactionHash =
        '502332239efc0407eebef5c73c390080e5d7e1b127ff29f786a62b3c9ab6cfe7';
    const blockItemStatus = await clientV2.getBlockItemStatus(transactionHash);

    expect(blockItemStatus).toEqual(expected.blockItemStatusTransfer);
});

test('getInstanceInfo', async () => {
    const contractAddress = {
        index: 0n,
        subindex: 0n,
    };
    const instanceInfo = await clientV2.getInstanceInfo(
        contractAddress,
        testBlockHash
    );

    expect(instanceInfo).toEqual(expected.instanceInfo);
});

test('Failed invoke contract', async () => {
    const result = await clientV2.invokeContract(
        {
            invoker: testAccount,
            contract: {
                index: 6n,
                subindex: 0n,
            },
            method: 'PiggyBank.smash',
            amount: new v1.CcdAmount(0n),
            parameter: undefined,
            energy: 30000n,
        },
        testBlockHash
    );

    if (result.tag !== 'failure') {
        throw new Error('Expected invoke to be fail');
    }

    expect(result.usedEnergy).toBe(340n);
    expect(result.reason.tag).toBe(v1.RejectReasonTag.RejectedReceive);
});

test('Invoke contract on v0 contract', async () => {
    const result = await clientV2.invokeContract(
        {
            invoker: testAccount,
            contract: {
                index: 6n,
                subindex: 0n,
            },
            method: 'PiggyBank.insert',
            amount: new v1.CcdAmount(1n),
            parameter: undefined,
            energy: 30000n,
        },
        testBlockHash
    );

    expect(result).toEqual(expected.invokeInstanceResponseV0);
});

test('Invoke contract same in v1 and v2 on v1 contract', async () => {
    const context = {
        invoker: testAccount,
        contract: {
            index: 81n,
            subindex: 0n,
        },
        method: 'PiggyBank.view',
        amount: new v1.CcdAmount(0n),
        parameter: undefined,
        energy: 30000n,
    };
    const resultV1 = await clientV1.invokeContract(context, testBlockHash);
    const resultV2 = await clientV2.invokeContract(context, testBlockHash);

    expect(resultV2).toEqual(resultV1);
});

test('getModuleSource', async () => {
    const localModuleBytes = getModuleBuffer('test/resources/piggy_bank.wasm');
    const moduleRef = new v1.ModuleReference(
        Buffer.from(
            'foOYrcQGqX202GnD/XrcgToxg2Z6On2weOuub33OX2Q=',
            'base64'
        ).toString('hex')
    );

    const localModuleHex = Buffer.from(localModuleBytes);
    const moduleSource = await clientV2.getModuleSource(
        moduleRef,
        testBlockHash
    );

    expect(localModuleHex).toEqual(moduleSource);
});

test('getConsensusInfo', async () => {
    const genesisBlock = Buffer.from(
        'QiEzLTThaUFowqDAs/0PJzgJYSyxPQANXC4A6F9Q95Y=',
        'base64'
    );

    const consensusInfo = await clientV2.client.getConsensusInfo(v2.Empty)
        .response;

    expect(consensusInfo.genesisBlock?.value).toEqual(genesisBlock);
    expect(consensusInfo.lastFinalizedTime?.value).toBeGreaterThan(
        1669214033937n
    );
    expect(consensusInfo.lastFinalizedBlockHeight?.value).toBeGreaterThan(
        1395315n
    );
});

test('sendBlockItem', async () => {
    const senderAccount = new v1.AccountAddress(
        '37TRfx9PqFX386rFcNThyA3zdoWsjF8Koy6Nh3i8VrPy4duEsA'
    );
    const privateKey =
        '1f7d20585457b542b22b51f218f0636c8e05ead4b64074e6eafd1d418b04e4ac';
    const nextNonce = await clientV2.getNextAccountNonce(senderAccount);

    // Create local transaction
    const header: v1.AccountTransactionHeader = {
        expiry: new v1.TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextNonce.nonce,
        sender: senderAccount,
    };
    const simpleTransfer: v1.SimpleTransferPayload = {
        amount: new v1.CcdAmount(10000000000n),
        toAddress: testAccount,
    };
    const accountTransaction: v1.AccountTransaction = {
        header: header,
        payload: simpleTransfer,
        type: v1.AccountTransactionType.Transfer,
    };

    // Sign transaction
    const signer = buildBasicAccountSigner(privateKey);
    const signature: v1.AccountTransactionSignature = await signTransaction(
        accountTransaction,
        signer
    );

    expect(
        clientV2.sendAccountTransaction(accountTransaction, signature)
    ).rejects.toThrow(
        '3 INVALID_ARGUMENT: The sender did not have enough funds to cover the costs'
    );
});

test('transactionHash', async () => {
    const senderAccount = new v1.AccountAddress(
        '37TRfx9PqFX386rFcNThyA3zdoWsjF8Koy6Nh3i8VrPy4duEsA'
    );
    const privateKey =
        '1f7d20585457b542b22b51f218f0636c8e05ead4b64074e6eafd1d418b04e4ac';
    const nextNonce = await clientV2.getNextAccountNonce(senderAccount);

    // Create local transaction
    const headerLocal: v1.AccountTransactionHeader = {
        expiry: new v1.TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextNonce.nonce,
        sender: senderAccount,
    };
    const simpleTransfer: v1.SimpleTransferPayload = {
        amount: new v1.CcdAmount(10000000000n),
        toAddress: testAccount,
    };
    const transaction: v1.AccountTransaction = {
        header: headerLocal,
        payload: simpleTransfer,
        type: v1.AccountTransactionType.Transfer,
    };

    const rawPayload = serializeAccountTransactionPayload(transaction);

    // Energy cost
    const accountTransactionHandler = getAccountTransactionHandler(
        transaction.type
    );
    const baseEnergyCost = accountTransactionHandler.getBaseEnergyCost(
        transaction.payload
    );
    const energyCost = calculateEnergyCost(
        1n,
        BigInt(rawPayload.length),
        baseEnergyCost
    );

    // Sign transaction
    const signer = buildBasicAccountSigner(privateKey);
    const signature: v1.AccountTransactionSignature = await signTransaction(
        transaction,
        signer
    );

    // Put together sendBlockItemRequest
    const header: v2.AccountTransactionHeader = {
        sender: { value: transaction.header.sender.decodedAddress },
        sequenceNumber: { value: transaction.header.nonce },
        energyAmount: { value: energyCost },
        expiry: { value: transaction.header.expiry.expiryEpochSeconds },
    };
    const accountTransaction: v2.PreAccountTransaction = {
        header: header,
        payload: {
            payload: { oneofKind: 'rawPayload', rawPayload: rawPayload },
        },
    };

    const serializedAccountTransaction = serializeAccountTransaction(
        transaction,
        signature
    ).slice(71);
    const localHash = Buffer.from(
        sha256([serializedAccountTransaction])
    ).toString('hex');
    const nodeHash = await clientV2.client.getAccountTransactionSignHash(
        accountTransaction
    ).response;

    expect(localHash).toEqual(Buffer.from(nodeHash.value).toString('hex'));
});

// Todo: verify that accounts can actually be created.
test('createAccount', async () => {
    // Get information from node
    const lastFinalizedBlockHash = (await clientV2.getConsensusStatus())
        .lastFinalizedBlock;
    if (!lastFinalizedBlockHash) {
        throw new Error('Could not find latest finalized block.');
    }
    const cryptoParams = await clientV2.getCryptographicParameters(
        lastFinalizedBlockHash
    );
    if (!cryptoParams) {
        throw new Error(
            'Cryptographic parameters were not found on a block that has been finalized.'
        );
    }

    // Create credentialDeploymentTransaction
    const identityInput: v1.IdentityInput = getIdentityInput();
    const threshold = 1;
    const credentialIndex = 1;
    const expiry = new v1.TransactionExpiry(new Date(Date.now() + 3600000));
    const revealedAttributes: v1.AttributeKey[] = [];
    const publicKeys: v1.VerifyKey[] = [
        {
            schemeId: 'Ed25519',
            verifyKey:
                'c8cd7623c5a9316d8e2fccb51e1deee615bdb5d324fb4a6d33801848fb5e459e',
        },
    ];

    const credentialDeploymentTransaction: v1.CredentialDeploymentTransaction =
        createCredentialDeploymentTransaction(
            identityInput,
            cryptoParams,
            threshold,
            publicKeys,
            credentialIndex,
            revealedAttributes,
            expiry
        );

    // Sign transaction
    const hashToSign = getCredentialDeploymentSignDigest(
        credentialDeploymentTransaction
    );
    const signingKey1 =
        '1053de23867e0f92a48814aabff834e2ca0b518497abaef71cad4e1be506334a';
    const signature = Buffer.from(
        await ed.sign(hashToSign, signingKey1)
    ).toString('hex');
    const signatures: string[] = [signature];

    expect(
        clientV2.sendCredentialDeploymentTransaction(
            credentialDeploymentTransaction,
            signatures
        )
    ).rejects.toThrow(
        '3 INVALID_ARGUMENT: The credential deployment was expired'
    );
});
