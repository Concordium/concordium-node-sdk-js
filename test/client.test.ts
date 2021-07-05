import { credentials, Metadata } from "@grpc/grpc-js";
import ConcordiumNodeClient from "../src/client";
import { ConsensusStatus } from "../src/types";

/**
 * Checks if the input string is a valid hexadecimal string.
 * @param str the string to check for hexadecimal
 */
function isHex(str: string): boolean {
    return /^[A-F0-9]+$/i.test(str);
}

const metadata = new Metadata();
metadata.add("authentication", "rpcadmin");
const client = new ConcordiumNodeClient(
    "127.0.0.1",
    10000,
    credentials.createInsecure(),
    metadata,
    15000
);

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
