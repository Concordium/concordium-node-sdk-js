import type { Upward } from '../grpc/upward.js';
import type { HexString, IpAddressString } from '../types.js';

export interface PeerInfo {
    peerId: HexString;
    ip: IpAddressString;
    port: number;
    networkStats?: PeerNetworkStats;
    consensusInfo: PeerConsensusInfo;
}

export interface PeerNetworkStats {
    packetsSent: bigint;
    packetsReceived: bigint;
    latency: bigint;
}

export type PeerConsensusInfo = PeerConsensusInfoBootstrapper | PeerConsensusInfoCatchupStatus;

export interface PeerConsensusInfoBootstrapper {
    tag: 'bootstrapper';
}

export interface PeerConsensusInfoCatchupStatus {
    tag: 'nodeCatchupStatus';
    catchupStatus: Upward<NodeCatchupStatus>;
}

export enum NodeCatchupStatus {
    UpToDate = 0,
    Pending = 1,
    CatchingUp = 2,
}
