import { ChannelCredentials, Metadata, ServiceError } from '@grpc/grpc-js';
import { Buffer as BufferFormater } from 'buffer/';
import { P2PClient } from '../grpc/concordium_p2p_rpc_grpc_pb';
import {
    AccountAddress,
    BlockHash,
    BlockHeight,
    Empty,
    GetAddressInfoRequest,
    GetPoolStatusRequest,
    GetModuleSourceRequest,
    PeerListResponse,
    PeersRequest,
    SendTransactionRequest,
    TransactionHash,
    InvokeContractRequest,
} from '../grpc/concordium_p2p_rpc_pb';
import {
    serializeAccountTransactionForSubmission,
    serializeCredentialDeploymentTransactionForSubmission,
    AccountAddress as Address,
    CredentialRegistrationId,
    AccountBakerDetails,
    AccountEncryptedAmount,
    AccountInfo,
    AccountReleaseSchedule,
    AccountTransaction,
    AccountTransactionSignature,
    ArInfo,
    BlockInfo,
    BlockSummary,
    ConsensusStatus,
    ContractAddress,
    CredentialDeploymentTransaction,
    CryptographicParameters,
    ExchangeRate,
    FinalizationData,
    IpInfo,
    KeysWithThreshold,
    NextAccountNonce,
    PartyInfo,
    ReleaseSchedule,
    TransactionStatus,
    TransactionSummary,
    TransferredEvent,
    UpdateQueue,
    Versioned,
    InstanceInfo,
    InstanceInfoSerialized,
    BakerId,
    ChainParametersV0,
    ChainParametersV1,
    PoolStatus,
    BakerPoolStatusDetails,
    CurrentPaydayBakerPoolStatus,
    KeysMatching,
    BakerPoolPendingChangeReduceBakerCapitalDetails,
    BakerPoolStatus,
    RewardStatusV0,
    RewardStatus,
    RewardStatusV1,
    ReduceStakePendingChangeV0,
    PassiveDelegationStatus,
    PassiveDelegationStatusDetails,
    ContractContext,
    InvokeContractResultV1,
    CcdAmount,
    ModuleReference,
    ReduceStakePendingChangeV1,
    buildInvoker,
} from '@concordium/common-sdk';
import {
    buildJsonResponseReviver,
    intToStringTransformer,
    isValidHash,
    stringToInt,
} from '@concordium/common-sdk/lib/util';
import {
    intListToStringList,
    unwrapBoolResponse,
    unwrapJsonResponse,
} from './util';

/**
 * A concordium-node specific gRPC client wrapper.
 *
 * @example
 * import ConcordiumNodeClient from "..."
 * const client = new ConcordiumNodeClient('127.0.0.1', 10000, credentials, metadata, 15000);
 */
export default class ConcordiumNodeClient {
    client: P2PClient;

    metadata: Metadata;

    address: string;

    port: number;

    timeout: number;

    /**
     * Initialize a gRPC client for a specific concordium node.
     * @param address the ip address of the node, e.g. 127.0.0.1
     * @param port the port to use when econnecting to the node
     * @param credentials credentials to use to connect to the node
     * @param timeout milliseconds to wait before timing out
     * @param options optional options for the P2PClient
     */
    constructor(
        address: string,
        port: number,
        credentials: ChannelCredentials,
        metadata: Metadata,
        timeout: number,
        options?: Record<string, unknown>
    ) {
        if (timeout < 0 || !Number.isSafeInteger(timeout)) {
            throw new Error(
                'The timeout must be a positive integer, but was: ' + timeout
            );
        }

        this.address = address;
        this.port = port;
        this.timeout = timeout;
        this.metadata = metadata;
        this.client = new P2PClient(`${address}:${port}`, credentials, options);
    }

    /**
     * Sends a credential deployment transaction, for creating a new account,
     * to the node to be put in a block on the chain.
     *
     * Note that a transaction can still fail even if it was accepted by the node.
     * To keep track of the transaction use getTransactionStatus.
     * @param credentialDeploymentTransaction the credential deployment transaction to send to the node
     * @param signatures the signatures on the hash of the serialized unsigned credential deployment information, in order
     * @returns true if the transaction was accepted, otherwise false
     */
    async sendCredentialDeploymentTransaction(
        credentialDeploymentTransaction: CredentialDeploymentTransaction,
        signatures: string[]
    ): Promise<boolean> {
        const serializedCredentialDeploymentTransaction: Buffer = Buffer.from(
            serializeCredentialDeploymentTransactionForSubmission(
                credentialDeploymentTransaction,
                signatures
            )
        );

        const sendTransactionRequest = new SendTransactionRequest();
        sendTransactionRequest.setNetworkId(100);
        sendTransactionRequest.setPayload(
            serializedCredentialDeploymentTransaction
        );

        const response = await this.sendRequest(
            this.client.sendTransaction,
            sendTransactionRequest
        );
        return unwrapBoolResponse(response);
    }

    /**
     * Serializes and sends an account transaction to the node to be
     * put in a block on the chain.
     *
     * Note that a transaction can still fail even if it was accepted by the node.
     * To keep track of the transaction use getTransactionStatus.
     * @param accountTransaction the transaction to send to the node
     * @param signatures the signatures on the signing digest of the transaction
     * @returns true if the transaction was accepted, otherwise false
     */
    async sendAccountTransaction(
        accountTransaction: AccountTransaction,
        signatures: AccountTransactionSignature
    ): Promise<boolean> {
        const serializedAccountTransaction: Buffer = Buffer.from(
            serializeAccountTransactionForSubmission(
                accountTransaction,
                signatures
            )
        );

        const sendTransactionRequest = new SendTransactionRequest();
        sendTransactionRequest.setNetworkId(100);
        sendTransactionRequest.setPayload(serializedAccountTransaction);

        const response = await this.sendRequest(
            this.client.sendTransaction,
            sendTransactionRequest
        );
        return unwrapBoolResponse(response);
    }

    /**
     * Retrieves the account info for the given account. If the provided block
     * hash is in a block prior to the finalization of the account, then the account
     * information will not be available.
     * A credential registration id can also be provided, instead of an address. In this case
     * the node will return the account info of the account, which the corresponding credential
     * is (or was) deployed to.
     * @param accountAddress base58 account address (or a credential registration id) to get the account info for
     * @param blockHash the block hash to get the account info at
     * @returns the account info for the provided account address, undefined is the account does not exist
     */
    async getAccountInfo(
        accountAddress: string | Address | CredentialRegistrationId,
        blockHash: string
    ): Promise<AccountInfo | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const getAddressInfoRequest = new GetAddressInfoRequest();

        if (typeof accountAddress === 'string') {
            getAddressInfoRequest.setAddress(accountAddress);
        } else if ('address' in accountAddress) {
            getAddressInfoRequest.setAddress(accountAddress.address);
        } else if ('credId' in accountAddress) {
            getAddressInfoRequest.setAddress(accountAddress.credId);
        } else {
            throw new Error('Invalid accountAddress input');
        }

        getAddressInfoRequest.setBlockHash(blockHash);

        const response = await this.sendRequest(
            this.client.getAccountInfo,
            getAddressInfoRequest
        );
        const datePropertyKeys: (
            | keyof ReleaseSchedule
            | keyof ReduceStakePendingChangeV1
        )[] = ['timestamp', 'effectiveTime'];
        const bigIntPropertyKeys: (
            | keyof AccountInfo
            | keyof AccountEncryptedAmount
            | keyof AccountReleaseSchedule
            | keyof ReleaseSchedule
            | keyof AccountBakerDetails
            | keyof ReduceStakePendingChangeV0
        )[] = [
            'accountAmount',
            'accountNonce',
            'accountIndex',
            'startIndex',
            'total',
            'amount',
            'stakedAmount',
            'bakerId',
            'newStake',
            'epoch',
        ];
        return unwrapJsonResponse<AccountInfo>(
            response,
            buildJsonResponseReviver(datePropertyKeys, bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    /**
     * Retrieves the next account nonce for the given account. The account nonce is
     * used in all account transactions as part of their header.
     * @param accountAddress base58 account address to get the next account nonce for
     * @returns the next account nonce, and a boolean indicating if the nonce is reliable
     */
    async getNextAccountNonce(
        accountAddress: Address
    ): Promise<NextAccountNonce | undefined> {
        const accountAddressObject = new AccountAddress();
        accountAddressObject.setAccountAddress(accountAddress.address);

        const response = await this.sendRequest(
            this.client.getNextAccountNonce,
            accountAddressObject
        );

        const bigIntPropertyKeys: (keyof NextAccountNonce)[] = ['nonce'];

        return unwrapJsonResponse<NextAccountNonce>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    /**
     * Retrieves a status for the given transaction.
     * @param transactionHash the transaction to get a status for
     * @returns the transaction status for the given transaction, or undefined if the transaction does not exist
     */
    async getTransactionStatus(
        transactionHash: string
    ): Promise<TransactionStatus | undefined> {
        if (!isValidHash(transactionHash)) {
            throw new Error(
                'The input was not a valid hash: ' + transactionHash
            );
        }

        const bigIntPropertyKeys: (keyof TransactionSummary)[] = [
            'cost',
            'energyCost',
            'index',
        ];

        const transactionHashObject = new TransactionHash();
        transactionHashObject.setTransactionHash(transactionHash);
        const response = await this.sendRequest(
            this.client.getTransactionStatus,
            transactionHashObject
        );
        return unwrapJsonResponse<TransactionStatus>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    /**
     * Retrieves the block summary for a specific block. This contains information
     * about finalization, update sequence numbers (their nonce), update queues,
     * updateable chain parameters and transaction summaries for any transaction
     * in the block.
     * @param blockHash the block to get the summary for
     * @returns the block summary for the given block, or undefined if the block does not exist
     */
    async getBlockSummary(
        blockHash: string
    ): Promise<BlockSummary | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const blockHashObject = new BlockHash();
        blockHashObject.setBlockHash(blockHash);

        const response = await this.sendRequest(
            this.client.getBlockSummary,
            blockHashObject
        );

        const bigIntPropertyKeys: (
            | keyof PartyInfo
            | keyof FinalizationData
            | keyof TransactionSummary
            | keyof (ChainParametersV0 & ChainParametersV1)
            | keyof ExchangeRate
            | keyof UpdateQueue
            | keyof KeysWithThreshold
            | keyof TransferredEvent
            | keyof ContractAddress
        )[] = [
            'bakerId',
            'weight',
            'finalizationIndex',
            'finalizationDelay',
            'cost',
            'energyCost',
            'index',
            'foundationAccountIndex',
            'numerator',
            'denominator',
            'nextSequenceNumber',
            'amount',
            'index',
            'subindex',

            // v0 keys
            'bakerCooldownEpochs',
            'minimumThresholdForBaking',

            // v1 keys
            'rewardPeriodLength',
            'minimumEquityCapital',
            'poolOwnerCooldown',
            'delegatorCooldown',
        ];

        return unwrapJsonResponse<BlockSummary>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys)
        );
    }

    /**
     * Retrieves information about a specific block.
     * @param blockHash the block to get information about
     * @returns the block information for the given block, or undefined if the block does not exist
     */
    async getBlockInfo(blockHash: string): Promise<BlockInfo | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const blockHashObject = new BlockHash();
        blockHashObject.setBlockHash(blockHash);
        const response = await this.sendRequest(
            this.client.getBlockInfo,
            blockHashObject
        );

        const datePropertyKeys: (keyof BlockInfo)[] = [
            'blockArriveTime',
            'blockReceiveTime',
            'blockSlotTime',
        ];
        const bigIntPropertyKeys: (keyof BlockInfo)[] = [
            'blockHeight',
            'blockBaker',
            'blockSlot',
            'transactionEnergyCost',
            'transactionCount',
            'transactionsSize',
        ];

        return unwrapJsonResponse<BlockInfo>(
            response,
            buildJsonResponseReviver(datePropertyKeys, bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    /**
     * Retrieves the blocks are the given height.
     * @param height the block height as a positive integer
     * @returns a string array containing the blocks at the given height, i.e. ['blockHash1', 'blockHash2', ...]
     */
    async getBlocksAtHeight(height: bigint): Promise<string[]> {
        if (height <= 0n) {
            throw new Error(
                'The block height has to be a positive integer, but it was: ' +
                    height
            );
        }
        const blockHeight = new BlockHeight();
        blockHeight.setBlockHeight(height.toString());
        const response = await this.sendRequest(
            this.client.getBlocksAtHeight,
            blockHeight
        );

        const blocksAtHeight = unwrapJsonResponse<string[]>(response);
        if (!blocksAtHeight) {
            return [];
        }
        return blocksAtHeight;
    }

    /**
     * Retrieves the consensus status information from the node. Note that the optional
     * fields will only be unavailable for a newly started node that has not processed
     * enough data yet.
     */
    async getConsensusStatus(): Promise<ConsensusStatus> {
        const response = await this.sendRequest(
            this.client.getConsensusStatus,
            new Empty()
        );

        const datePropertyKeys: (keyof ConsensusStatus)[] = [
            'blockLastReceivedTime',
            'blockLastArrivedTime',
            'genesisTime',
            'currentEraGenesisTime',
            'lastFinalizedTime',
        ];
        const bigIntPropertyKeys: (keyof ConsensusStatus)[] = [
            'epochDuration',
            'slotDuration',
            'bestBlockHeight',
            'lastFinalizedBlockHeight',
            'finalizationCount',
            'blocksVerifiedCount',
            'blocksReceivedCount',
            'protocolVersion',
        ];

        const consensusStatus = unwrapJsonResponse<ConsensusStatus>(
            response,
            buildJsonResponseReviver(datePropertyKeys, bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );

        if (!consensusStatus) {
            throw new Error(
                'Nothing was returned when trying to get the consensus status.'
            );
        }

        return consensusStatus;
    }

    /**
     * Retrieves the global cryptographic parameters on the blockchain at
     * the provided block.
     * @param blockHash the block to get the cryptographic parameters at
     * @returns the global cryptographic parameters at the given block, or undefined it the block does not exist.
     */
    async getCryptographicParameters(
        blockHash: string
    ): Promise<Versioned<CryptographicParameters> | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const blockHashObject = new BlockHash();
        blockHashObject.setBlockHash(blockHash);
        const response = await this.sendRequest(
            this.client.getCryptographicParameters,
            blockHashObject
        );

        return unwrapJsonResponse<
            Versioned<CryptographicParameters> | undefined
        >(response);
    }

    /**
     * Retrieves a list of the node's peers and connection information related to them.
     * @param includeBootstrappers whether or not any bootstrapper nodes should be included in the list
     * @returns a list of the node's peers and connection information related to them
     */
    async getPeerList(
        includeBootstrappers: boolean
    ): Promise<PeerListResponse> {
        const peersRequest = new PeersRequest();
        peersRequest.setIncludeBootstrappers(includeBootstrappers);
        const response = await this.sendRequest(
            this.client.peerList,
            peersRequest
        );
        return PeerListResponse.deserializeBinary(response);
    }

    /**
     * Retrieves the list of identity providers at the provided blockhash.
     * @param blockHash the block to get the identity providers at
     * @returns the list of identity providers at the given block
     */
    async getIdentityProviders(
        blockHash: string
    ): Promise<IpInfo[] | undefined> {
        const blockHashObject = new BlockHash();
        blockHashObject.setBlockHash(blockHash);
        const response = await this.sendRequest(
            this.client.getIdentityProviders,
            blockHashObject
        );
        return unwrapJsonResponse<IpInfo[]>(response);
    }

    /**
     * Retrieves the list of anonymity revokers at the provided blockhash.
     * @param blockHash the block to get the anonymity revokers at
     * @returns the list of anonymity revokers at the given block
     */
    async getAnonymityRevokers(
        blockHash: string
    ): Promise<ArInfo[] | undefined> {
        const blockHashObject = new BlockHash();
        blockHashObject.setBlockHash(blockHash);
        const response = await this.sendRequest(
            this.client.getAnonymityRevokers,
            blockHashObject
        );
        return unwrapJsonResponse<ArInfo[]>(response);
    }

    /**
     * Retrieves the addresses of all smart contract instances.
     * @param blockHash the block hash to get the smart contact instances at
     * @returns a list of contract addresses on the chain, i.e. [{"subindex":0,"index":0},{"subindex":0,"index":1}, ....]
     */
    async getInstances(
        blockHash: string
    ): Promise<ContractAddress[] | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }
        const blockHashObject = new BlockHash();
        blockHashObject.setBlockHash(blockHash);

        const response = await this.sendRequest(
            this.client.getInstances,
            blockHashObject
        );
        const bigIntPropertyKeys: (keyof ContractAddress)[] = [
            'index',
            'subindex',
        ];

        return unwrapJsonResponse<ContractAddress[]>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    /**
     * Retrieve information about a given smart contract instance.
     * @param blockHash the block hash to get the smart contact instances at
     * @param address the address of the smart contract
     * @returns A JSON object with information about the contract instance
     */
    async getInstanceInfo(
        address: ContractAddress,
        blockHash: string
    ): Promise<InstanceInfo | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }
        const getAddressInfoRequest = new GetAddressInfoRequest();
        getAddressInfoRequest.setAddress(
            `{"subindex":${address.subindex},"index":${address.index}}`
        );
        getAddressInfoRequest.setBlockHash(blockHash);

        const response = await this.sendRequest(
            this.client.getInstanceInfo,
            getAddressInfoRequest
        );

        const result = unwrapJsonResponse<InstanceInfoSerialized>(response);
        if (result !== undefined) {
            const common = {
                amount: new CcdAmount(BigInt(result.amount)),
                sourceModule: new ModuleReference(result.sourceModule),
                owner: new Address(result.owner),
                methods: result.methods,
                name: result.name,
            };

            switch (result.version) {
                case 1:
                    return {
                        version: 1,
                        ...common,
                    };
                case undefined:
                case 0:
                    return {
                        version: 0,
                        ...common,
                        model: BufferFormater.from(result.model, 'hex'),
                    };
                default:
                    throw new Error(
                        'InstanceInfo had unsupported version: ' +
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (result as any).version
                    );
            }
        }
    }

    async getRewardStatus(
        blockHash: string
    ): Promise<RewardStatus | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        type DateKey = KeysMatching<RewardStatusV1, Date>;
        type BigIntKey = KeysMatching<RewardStatusV0 & RewardStatusV1, bigint>;

        const dates: DateKey[] = ['nextPaydayTime'];
        const bigInts: BigIntKey[] = [
            'protocolVersion',
            'gasAccount',
            'totalAmount',
            'totalStakedCapital',
            'bakingRewardAccount',
            'totalEncryptedAmount',
            'finalizationRewardAccount',
            'foundationTransactionRewards',
        ];

        const bh = new BlockHash();
        bh.setBlockHash(blockHash);

        const response = await this.sendRequest(
            this.client.getRewardStatus,
            bh
        );

        return unwrapJsonResponse<RewardStatus>(
            response,
            buildJsonResponseReviver(dates, bigInts),
            intToStringTransformer(bigInts)
        );
    }

    /**
     * Retrieve list of bakers on the network.
     * @param blockHash the block hash to get the smart contact instances at
     * @returns A JSON list of baker IDs
     */
    async getBakerList(blockHash: string): Promise<BakerId[] | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const bh = new BlockHash();
        bh.setBlockHash(blockHash);

        const response = await this.sendRequest(this.client.getBakerList, bh);

        return unwrapJsonResponse<BakerId[]>(
            response,
            undefined,
            intListToStringList
        )?.map((v) => BigInt(v));
    }

    /**
     * Gets the status of passive delegation.
     * @param blockHash the block hash the status at
     * @returns The status of passive delegation.
     */
    async getPoolStatus(
        blockHash: string
    ): Promise<PassiveDelegationStatus | undefined>;
    /**
     * Gets the status a baker.
     * @param blockHash the block hash the status at
     * @param bakerId the ID of the baker to get the status for.
     * @returns The status of the corresponding baker pool.
     */
    async getPoolStatus(
        blockHash: string,
        bakerId: BakerId
    ): Promise<BakerPoolStatus | undefined>;
    /**
     * Gets the status of either a baker, if a baker ID is supplied, or passive delegation if left undefined.
     * @param blockHash the block hash the status at
     * @param [bakerId] the ID of the baker to get the status for. If left undefined, the status of passive delegation is returned.
     * @returns The status of the corresponding pool.
     */
    async getPoolStatus(
        blockHash: string,
        bakerId?: BakerId
    ): Promise<PoolStatus | undefined>;
    async getPoolStatus(
        blockHash: string,
        bakerId?: BakerId
    ): Promise<PoolStatus | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const req = new GetPoolStatusRequest();
        req.setBlockHash(blockHash);
        req.setPassiveDelegation(bakerId === undefined);

        if (bakerId !== undefined) {
            req.setBakerId(bakerId.toString());
        }

        type DateKey = KeysMatching<
            BakerPoolPendingChangeReduceBakerCapitalDetails,
            Date
        >;
        type BigIntKey = KeysMatching<
            BakerPoolStatusDetails &
                PassiveDelegationStatusDetails &
                CurrentPaydayBakerPoolStatus,
            bigint
        >;

        const dates: DateKey[] = ['effectiveTime'];
        const bigInts: BigIntKey[] = [
            'bakerId',
            'bakerEquityCapital',
            'delegatedCapital',
            'delegatedCapitalCap',
            'currentPaydayTransactionFeesEarned',
            'currentPaydayDelegatedCapital',
            'blocksBaked',
            'transactionFeesEarned',
            'effectiveStake',
            'allPoolTotalCapital',
        ];

        const response = await this.sendRequest(this.client.getPoolStatus, req);

        return unwrapJsonResponse<PoolStatus>(
            response,
            buildJsonResponseReviver(dates, bigInts),
            intToStringTransformer(bigInts)
        );
    }

    /**
     * Retrieves the source of the given module at
     * the provided block.
     * @param moduleReference the module's reference, which is the hex encoded hash of the source.
     * @param blockHash the block to get the cryptographic parameters at
     * @returns the source of the module as raw bytes.
     */
    async getModuleSource(
        moduleReference: ModuleReference,
        blockHash: string
    ): Promise<Buffer | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }
        const requestObject = new GetModuleSourceRequest();
        requestObject.setBlockHash(blockHash);
        requestObject.setModuleRef(moduleReference.moduleRef);

        const response = await this.sendRequest(
            this.client.getModuleSource,
            requestObject
        );

        if (response.length === 0) {
            return undefined;
        }
        return Buffer.from(response);
    }

    /**
     * Invokes a smart contract.
     * @param context the collection of details used to invoke the contract. Must include the address of the contract and the method invoked.
     * @param blockHash the block hash at which the contract should be invoked at. The contract is invoked in the state at the end of this block.
     * @returns If the node was able to invoke, then a object describing the outcome is returned.
     * The outcome is determined by the `tag` field, which is either `success` or `failure`.
     * The `usedEnergy` field will always be present, and is the amount of NRG was used during the execution.
     * If the tag is `success`, then an `events` field is present, and it contains the events that would have been generated.
     * If invoking a V1 contract and it produces a return value, it will be present in the `returnValue` field.
     * If the tag is `failure`, then a `reason` field is present, and it contains the reason the update would have been rejected.
     * If either the block does not exist, or then node fails to parse of any of the inputs, then undefined is returned.
     */
    async invokeContract(
        contractContext: ContractContext,
        blockHash: string
    ): Promise<InvokeContractResultV1 | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const requestObject = new InvokeContractRequest();
        requestObject.setBlockHash(blockHash);
        requestObject.setContext(
            stringToInt(
                JSON.stringify({
                    invoker: buildInvoker(contractContext.invoker),
                    contract: {
                        subindex: contractContext.contract.subindex.toString(),
                        index: contractContext.contract.index.toString(),
                    },
                    amount:
                        contractContext.amount &&
                        contractContext.amount.microCcdAmount.toString(),
                    method: contractContext.method,
                    parameter:
                        contractContext.parameter &&
                        contractContext.parameter.toString('hex'),
                    energy:
                        contractContext.energy &&
                        Number(contractContext.energy.toString()),
                }),
                ['index', 'subindex']
            )
        );

        const response = await this.sendRequest(
            this.client.invokeContract,
            requestObject
        );
        const bigIntPropertyKeys = [
            'usedEnergy',
            'index',
            'subindex',
            'amount',
        ];
        return unwrapJsonResponse<InvokeContractResultV1>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    sendRequest<T>(command: any, input: T): Promise<Uint8Array> {
        const deadline = new Date(Date.now() + this.timeout);
        return new Promise<Uint8Array>((resolve, reject) => {
            this.client.waitForReady(deadline, (error) => {
                if (error) {
                    return reject(error);
                }

                return command.bind(this.client)(
                    input,
                    this.metadata,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (err: ServiceError | null, response: any) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(response.serializeBinary());
                    }
                );
            });
        });
    }
}
