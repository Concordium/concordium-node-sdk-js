import { ConsensusStatus } from '@concordium/common-sdk';
import { isHex } from '@concordium/common-sdk';
import { getNodeClient } from './testHelpers';

const client = getNodeClient();
test('retrieves the consensus status from the node with correct types', async () => {
    const consensusStatus: ConsensusStatus = await client.getConsensusStatus();

    return Promise.all([
        expect(isHex(consensusStatus.bestBlock)).toBeTruthy(),
        expect(isHex(consensusStatus.genesisBlock)).toBeTruthy(),
        expect(isHex(consensusStatus.lastFinalizedBlock)).toBeTruthy(),
        expect(
            typeof consensusStatus.finalizationCount === 'bigint'
        ).toBeTruthy(),
        expect(
            typeof consensusStatus.blocksVerifiedCount === 'bigint'
        ).toBeTruthy(),
        expect(
            typeof consensusStatus.blocksReceivedCount === 'bigint'
        ).toBeTruthy(),
        expect(consensusStatus.blockLastArrivedTime).toBeInstanceOf(Date),
        expect(consensusStatus.blockLastReceivedTime).toBeInstanceOf(Date),
        expect(consensusStatus.genesisTime).toBeInstanceOf(Date),
        expect(consensusStatus.lastFinalizedTime).toBeInstanceOf(Date),
        expect(consensusStatus.currentEraGenesisTime).toBeInstanceOf(Date),

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
        expect(Number.isNaN(consensusStatus.genesisIndex)).toBeFalsy(),

        expect(typeof consensusStatus.epochDuration === 'bigint').toBeTruthy(),
        expect(typeof consensusStatus.slotDuration === 'bigint').toBeTruthy(),
        expect(
            typeof consensusStatus.bestBlockHeight === 'bigint'
        ).toBeTruthy(),
        expect(
            typeof consensusStatus.lastFinalizedBlockHeight === 'bigint'
        ).toBeTruthy(),
        expect(
            typeof consensusStatus.protocolVersion === 'bigint'
        ).toBeTruthy(),
    ]);
});
