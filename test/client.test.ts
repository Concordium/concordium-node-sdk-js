import { credentials, Metadata } from "@grpc/grpc-js";
import ConcordiumNodeClient from "../src/client";
import {
    BlockInfo,
    ConsensusStatus,
    TransactionStatus,
    TransactionSummary,
} from "../src/types";
import { isHex } from "../src/util";

const metadata = new Metadata();
metadata.add("authentication", "rpcadmin");
const client = new ConcordiumNodeClient(
    "127.0.0.1",
    10000,
    credentials.createInsecure(),
    metadata,
    15000
);

test("transaction status for invalid hash fails", async () => {
    const invalidTransactionHash = "P{L}GDA";
    await expect(
        client.getTransactionStatus(invalidTransactionHash)
    ).rejects.toEqual(
        new Error("The input was not a valid hash: " + invalidTransactionHash)
    );
});

test("transaction status for unknown transaction hash returns null", async () => {
    const transactionHash =
        "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
    const transactionStatus: TransactionStatus =
        await client.getTransactionStatus(transactionHash);
    return expect(transactionStatus).toBeNull();
});

test("retrieves transaction status", async () => {
    const transactionHash =
        "f1f5f966e36b95d5474e6b85b85c273c81bac347c38621a0d8fefe68b69a430f";
    const transactionStatus: TransactionStatus =
        await client.getTransactionStatus(transactionHash);
    const outcome: TransactionSummary = Object.values(
        transactionStatus.outcomes
    )[0];

    return Promise.all([
        expect(transactionStatus.status).toEqual("finalized"),
        expect(outcome.hash).toEqual(
            "f1f5f966e36b95d5474e6b85b85c273c81bac347c38621a0d8fefe68b69a430f"
        ),
        expect(outcome.sender).toEqual(
            "3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt"
        ),
        expect(outcome.cost).toEqual(5010n),
        expect(outcome.energyCost).toEqual(501n),
        expect(outcome.type.type).toEqual("accountTransaction"),
        expect(outcome.index).toEqual(0n),
    ]);
});

test("invalid block hash fails", async () => {
    const invalidBlockHash = "P{L}GDA";
    await expect(client.getBlockInfo(invalidBlockHash)).rejects.toEqual(
        new Error("The input was not a valid hash: " + invalidBlockHash)
    );
});

test("unknown block hash returns null", async () => {
    const blockHash =
        "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
    const blockInfo: BlockInfo = await client.getBlockInfo(blockHash);
    return expect(blockInfo).toBeNull();
});

test("retrieves block info", async () => {
    const blockHash =
        "7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749";
    const blockInfo: BlockInfo = await client.getBlockInfo(blockHash);

    return Promise.all([
        expect(blockInfo.transactionsSize).toEqual(0n),
        expect(blockInfo.blockParent).toEqual(
            "2633deb76d59bb4d3d78cdfaa3ab1920bb88332ae98bd2d7d52adfd8e553996f"
        ),
        expect(blockInfo.blockHash).toEqual(
            "7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749"
        ),
        expect(blockInfo.finalized).toBeTruthy(),
        expect(blockInfo.blockStateHash).toEqual(
            "b40762eb4abb9701ee133c465f934075d377c0d09bfe209409e80bbb51af1771"
        ),
        expect(blockInfo.blockArriveTime).toEqual(
            new Date("2021-07-05T09:16:46.000Z")
        ),
        expect(blockInfo.blockReceiveTime).toEqual(
            new Date("2021-07-05T09:16:46.000Z")
        ),
        expect(blockInfo.transactionCount).toEqual(0n),
        expect(blockInfo.transactionEnergyCost).toEqual(0n),
        expect(blockInfo.blockSlot).toEqual(1915967n),
        expect(blockInfo.blockLastFinalized).toEqual(
            "2633deb76d59bb4d3d78cdfaa3ab1920bb88332ae98bd2d7d52adfd8e553996f"
        ),
        expect(blockInfo.blockSlotTime).toEqual(
            new Date("2021-05-13T01:03:11.750Z")
        ),
        expect(blockInfo.blockHeight).toEqual(22737n),
        expect(blockInfo.blockBaker).toEqual(3n),
    ]);
});

test("negative block height throws an error", async () => {
    const blockHeight = -431n;
    await expect(client.getBlocksAtHeight(blockHeight)).rejects.toEqual(
        new Error(
            "The block height has to be a positive integer, but it was: " +
                blockHeight
        )
    );
});

test("no blocks returned for height not yet reached", async () => {
    const blockHeight = 18446744073709551615n;
    const blocksAtHeight: string[] = await client.getBlocksAtHeight(
        blockHeight
    );
    return expect(blocksAtHeight.length).toEqual(0);
});

test("retrieves blocks at block height", async () => {
    const blockHeight = 314n;
    const blocksAtHeight: string[] = await client.getBlocksAtHeight(
        blockHeight
    );
    return Promise.all([
        expect(blocksAtHeight.length).toEqual(1),
        expect(blocksAtHeight[0]).toEqual(
            "072a02694ec6539d022e616eeb9f05bacea60e1d7278d34457daeca5e6380b61"
        ),
    ]);
});

test("retrieves the consensus status from the node with correct types", async () => {
    const consensusStatus: ConsensusStatus = await client.getConsensusStatus();
    return Promise.all([
        expect(isHex(consensusStatus.bestBlock)).toBeTruthy(),
        expect(isHex(consensusStatus.genesisBlock)).toBeTruthy(),
        expect(isHex(consensusStatus.lastFinalizedBlock)).toBeTruthy(),
        expect(
            Number.isInteger(consensusStatus.finalizationCount)
        ).toBeTruthy(),
        expect(
            Number.isInteger(consensusStatus.blocksVerifiedCount)
        ).toBeTruthy(),
        expect(
            Number.isInteger(consensusStatus.blocksReceivedCount)
        ).toBeTruthy(),
        expect(consensusStatus.blockLastArrivedTime).toBeInstanceOf(Date),
        expect(consensusStatus.blockLastReceivedTime).toBeInstanceOf(Date),
        expect(consensusStatus.genesisTime).toBeInstanceOf(Date),
        expect(consensusStatus.lastFinalizedTime).toBeInstanceOf(Date),

        expect(
            Number.isNaN(consensusStatus.blockArriveLatencyEMSD)
        ).toBeFalsy(),
        expect(Number.isNaN(consensusStatus.blockArriveLatencyEMA)).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.blockReceiveLatencyEMSD)
        ).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.blockReceiveLatencyEMA)
        ).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.transactionsPerBlockEMSD)
        ).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.transactionsPerBlockEMA)
        ).toBeFalsy(),

        expect(Number.isNaN(consensusStatus.blockReceivePeriodEMA)).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.blockReceivePeriodEMSD)
        ).toBeFalsy(),
        expect(Number.isNaN(consensusStatus.blockArrivePeriodEMA)).toBeFalsy(),
        expect(Number.isNaN(consensusStatus.blockArrivePeriodEMSD)).toBeFalsy(),
        expect(Number.isNaN(consensusStatus.finalizationPeriodEMA)).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.finalizationPeriodEMSD)
        ).toBeFalsy(),

        expect(typeof consensusStatus.epochDuration === "bigint").toBeTruthy(),
        expect(typeof consensusStatus.slotDuration === "bigint").toBeTruthy(),
        expect(
            typeof consensusStatus.bestBlockHeight === "bigint"
        ).toBeTruthy(),
    ]);
});
