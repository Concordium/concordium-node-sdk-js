// package: concordium
// file: concordium_p2p_rpc.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";

export class Empty extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Empty.AsObject;
    static toObject(includeInstance: boolean, msg: Empty): Empty.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Empty, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Empty;
    static deserializeBinaryFromReader(message: Empty, reader: jspb.BinaryReader): Empty;
}

export namespace Empty {
    export type AsObject = {
    }
}

export class NumberResponse extends jspb.Message { 
    getValue(): number;
    setValue(value: number): NumberResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NumberResponse.AsObject;
    static toObject(includeInstance: boolean, msg: NumberResponse): NumberResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NumberResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NumberResponse;
    static deserializeBinaryFromReader(message: NumberResponse, reader: jspb.BinaryReader): NumberResponse;
}

export namespace NumberResponse {
    export type AsObject = {
        value: number,
    }
}

export class BoolResponse extends jspb.Message { 
    getValue(): boolean;
    setValue(value: boolean): BoolResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoolResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BoolResponse): BoolResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoolResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoolResponse;
    static deserializeBinaryFromReader(message: BoolResponse, reader: jspb.BinaryReader): BoolResponse;
}

export namespace BoolResponse {
    export type AsObject = {
        value: boolean,
    }
}

export class StringResponse extends jspb.Message { 
    getValue(): string;
    setValue(value: string): StringResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StringResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StringResponse): StringResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StringResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StringResponse;
    static deserializeBinaryFromReader(message: StringResponse, reader: jspb.BinaryReader): StringResponse;
}

export namespace StringResponse {
    export type AsObject = {
        value: string,
    }
}

export class JsonResponse extends jspb.Message { 
    getValue(): string;
    setValue(value: string): JsonResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): JsonResponse.AsObject;
    static toObject(includeInstance: boolean, msg: JsonResponse): JsonResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: JsonResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): JsonResponse;
    static deserializeBinaryFromReader(message: JsonResponse, reader: jspb.BinaryReader): JsonResponse;
}

export namespace JsonResponse {
    export type AsObject = {
        value: string,
    }
}

export class BytesResponse extends jspb.Message { 
    getValue(): Uint8Array | string;
    getValue_asU8(): Uint8Array;
    getValue_asB64(): string;
    setValue(value: Uint8Array | string): BytesResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BytesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BytesResponse): BytesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BytesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BytesResponse;
    static deserializeBinaryFromReader(message: BytesResponse, reader: jspb.BinaryReader): BytesResponse;
}

export namespace BytesResponse {
    export type AsObject = {
        value: Uint8Array | string,
    }
}

export class PeerConnectRequest extends jspb.Message { 

    hasIp(): boolean;
    clearIp(): void;
    getIp(): google_protobuf_wrappers_pb.StringValue | undefined;
    setIp(value?: google_protobuf_wrappers_pb.StringValue): PeerConnectRequest;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): google_protobuf_wrappers_pb.Int32Value | undefined;
    setPort(value?: google_protobuf_wrappers_pb.Int32Value): PeerConnectRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PeerConnectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PeerConnectRequest): PeerConnectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PeerConnectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PeerConnectRequest;
    static deserializeBinaryFromReader(message: PeerConnectRequest, reader: jspb.BinaryReader): PeerConnectRequest;
}

export namespace PeerConnectRequest {
    export type AsObject = {
        ip?: google_protobuf_wrappers_pb.StringValue.AsObject,
        port?: google_protobuf_wrappers_pb.Int32Value.AsObject,
    }
}

export class PeerElement extends jspb.Message { 

    hasNodeId(): boolean;
    clearNodeId(): void;
    getNodeId(): google_protobuf_wrappers_pb.StringValue | undefined;
    setNodeId(value?: google_protobuf_wrappers_pb.StringValue): PeerElement;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): google_protobuf_wrappers_pb.UInt32Value | undefined;
    setPort(value?: google_protobuf_wrappers_pb.UInt32Value): PeerElement;

    hasIp(): boolean;
    clearIp(): void;
    getIp(): google_protobuf_wrappers_pb.StringValue | undefined;
    setIp(value?: google_protobuf_wrappers_pb.StringValue): PeerElement;
    getCatchupStatus(): PeerElement.CatchupStatus;
    setCatchupStatus(value: PeerElement.CatchupStatus): PeerElement;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PeerElement.AsObject;
    static toObject(includeInstance: boolean, msg: PeerElement): PeerElement.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PeerElement, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PeerElement;
    static deserializeBinaryFromReader(message: PeerElement, reader: jspb.BinaryReader): PeerElement;
}

export namespace PeerElement {
    export type AsObject = {
        nodeId?: google_protobuf_wrappers_pb.StringValue.AsObject,
        port?: google_protobuf_wrappers_pb.UInt32Value.AsObject,
        ip?: google_protobuf_wrappers_pb.StringValue.AsObject,
        catchupStatus: PeerElement.CatchupStatus,
    }

    export enum CatchupStatus {
    UPTODATE = 0,
    PENDING = 1,
    CATCHINGUP = 2,
    }

}

export class PeerListResponse extends jspb.Message { 
    getPeerType(): string;
    setPeerType(value: string): PeerListResponse;
    clearPeersList(): void;
    getPeersList(): Array<PeerElement>;
    setPeersList(value: Array<PeerElement>): PeerListResponse;
    addPeers(value?: PeerElement, index?: number): PeerElement;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PeerListResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PeerListResponse): PeerListResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PeerListResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PeerListResponse;
    static deserializeBinaryFromReader(message: PeerListResponse, reader: jspb.BinaryReader): PeerListResponse;
}

export namespace PeerListResponse {
    export type AsObject = {
        peerType: string,
        peersList: Array<PeerElement.AsObject>,
    }
}

export class PeerStatsResponse extends jspb.Message { 
    clearPeerstatsList(): void;
    getPeerstatsList(): Array<PeerStatsResponse.PeerStats>;
    setPeerstatsList(value: Array<PeerStatsResponse.PeerStats>): PeerStatsResponse;
    addPeerstats(value?: PeerStatsResponse.PeerStats, index?: number): PeerStatsResponse.PeerStats;
    getAvgBpsIn(): number;
    setAvgBpsIn(value: number): PeerStatsResponse;
    getAvgBpsOut(): number;
    setAvgBpsOut(value: number): PeerStatsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PeerStatsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PeerStatsResponse): PeerStatsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PeerStatsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PeerStatsResponse;
    static deserializeBinaryFromReader(message: PeerStatsResponse, reader: jspb.BinaryReader): PeerStatsResponse;
}

export namespace PeerStatsResponse {
    export type AsObject = {
        peerstatsList: Array<PeerStatsResponse.PeerStats.AsObject>,
        avgBpsIn: number,
        avgBpsOut: number,
    }


    export class PeerStats extends jspb.Message { 
        getNodeId(): string;
        setNodeId(value: string): PeerStats;
        getPacketsSent(): number;
        setPacketsSent(value: number): PeerStats;
        getPacketsReceived(): number;
        setPacketsReceived(value: number): PeerStats;
        getLatency(): number;
        setLatency(value: number): PeerStats;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): PeerStats.AsObject;
        static toObject(includeInstance: boolean, msg: PeerStats): PeerStats.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: PeerStats, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): PeerStats;
        static deserializeBinaryFromReader(message: PeerStats, reader: jspb.BinaryReader): PeerStats;
    }

    export namespace PeerStats {
        export type AsObject = {
            nodeId: string,
            packetsSent: number,
            packetsReceived: number,
            latency: number,
        }
    }

}

export class NetworkChangeRequest extends jspb.Message { 

    hasNetworkId(): boolean;
    clearNetworkId(): void;
    getNetworkId(): google_protobuf_wrappers_pb.Int32Value | undefined;
    setNetworkId(value?: google_protobuf_wrappers_pb.Int32Value): NetworkChangeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NetworkChangeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: NetworkChangeRequest): NetworkChangeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NetworkChangeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NetworkChangeRequest;
    static deserializeBinaryFromReader(message: NetworkChangeRequest, reader: jspb.BinaryReader): NetworkChangeRequest;
}

export namespace NetworkChangeRequest {
    export type AsObject = {
        networkId?: google_protobuf_wrappers_pb.Int32Value.AsObject,
    }
}

export class NodeInfoResponse extends jspb.Message { 

    hasNodeId(): boolean;
    clearNodeId(): void;
    getNodeId(): google_protobuf_wrappers_pb.StringValue | undefined;
    setNodeId(value?: google_protobuf_wrappers_pb.StringValue): NodeInfoResponse;
    getCurrentLocaltime(): number;
    setCurrentLocaltime(value: number): NodeInfoResponse;
    getPeerType(): string;
    setPeerType(value: string): NodeInfoResponse;
    getConsensusBakerRunning(): boolean;
    setConsensusBakerRunning(value: boolean): NodeInfoResponse;
    getConsensusRunning(): boolean;
    setConsensusRunning(value: boolean): NodeInfoResponse;
    getConsensusType(): string;
    setConsensusType(value: string): NodeInfoResponse;
    getConsensusBakerCommittee(): NodeInfoResponse.IsInBakingCommittee;
    setConsensusBakerCommittee(value: NodeInfoResponse.IsInBakingCommittee): NodeInfoResponse;
    getConsensusFinalizerCommittee(): boolean;
    setConsensusFinalizerCommittee(value: boolean): NodeInfoResponse;

    hasConsensusBakerId(): boolean;
    clearConsensusBakerId(): void;
    getConsensusBakerId(): google_protobuf_wrappers_pb.UInt64Value | undefined;
    setConsensusBakerId(value?: google_protobuf_wrappers_pb.UInt64Value): NodeInfoResponse;

    hasStagingNetUsername(): boolean;
    clearStagingNetUsername(): void;
    getStagingNetUsername(): google_protobuf_wrappers_pb.StringValue | undefined;
    setStagingNetUsername(value?: google_protobuf_wrappers_pb.StringValue): NodeInfoResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NodeInfoResponse.AsObject;
    static toObject(includeInstance: boolean, msg: NodeInfoResponse): NodeInfoResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NodeInfoResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NodeInfoResponse;
    static deserializeBinaryFromReader(message: NodeInfoResponse, reader: jspb.BinaryReader): NodeInfoResponse;
}

export namespace NodeInfoResponse {
    export type AsObject = {
        nodeId?: google_protobuf_wrappers_pb.StringValue.AsObject,
        currentLocaltime: number,
        peerType: string,
        consensusBakerRunning: boolean,
        consensusRunning: boolean,
        consensusType: string,
        consensusBakerCommittee: NodeInfoResponse.IsInBakingCommittee,
        consensusFinalizerCommittee: boolean,
        consensusBakerId?: google_protobuf_wrappers_pb.UInt64Value.AsObject,
        stagingNetUsername?: google_protobuf_wrappers_pb.StringValue.AsObject,
    }

    export enum IsInBakingCommittee {
    NOT_IN_COMMITTEE = 0,
    ADDED_BUT_NOT_ACTIVE_IN_COMMITTEE = 1,
    ADDED_BUT_WRONG_KEYS = 2,
    ACTIVE_IN_COMMITTEE = 3,
    }

}

export class BlockHash extends jspb.Message { 
    getBlockHash(): string;
    setBlockHash(value: string): BlockHash;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BlockHash.AsObject;
    static toObject(includeInstance: boolean, msg: BlockHash): BlockHash.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BlockHash, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BlockHash;
    static deserializeBinaryFromReader(message: BlockHash, reader: jspb.BinaryReader): BlockHash;
}

export namespace BlockHash {
    export type AsObject = {
        blockHash: string,
    }
}

export class AccountAddress extends jspb.Message { 
    getAccountAddress(): string;
    setAccountAddress(value: string): AccountAddress;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AccountAddress.AsObject;
    static toObject(includeInstance: boolean, msg: AccountAddress): AccountAddress.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AccountAddress, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AccountAddress;
    static deserializeBinaryFromReader(message: AccountAddress, reader: jspb.BinaryReader): AccountAddress;
}

export namespace AccountAddress {
    export type AsObject = {
        accountAddress: string,
    }
}

export class TransactionHash extends jspb.Message { 
    getTransactionHash(): string;
    setTransactionHash(value: string): TransactionHash;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TransactionHash.AsObject;
    static toObject(includeInstance: boolean, msg: TransactionHash): TransactionHash.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TransactionHash, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TransactionHash;
    static deserializeBinaryFromReader(message: TransactionHash, reader: jspb.BinaryReader): TransactionHash;
}

export namespace TransactionHash {
    export type AsObject = {
        transactionHash: string,
    }
}

export class BlockHashAndAmount extends jspb.Message { 
    getBlockHash(): string;
    setBlockHash(value: string): BlockHashAndAmount;
    getAmount(): number;
    setAmount(value: number): BlockHashAndAmount;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BlockHashAndAmount.AsObject;
    static toObject(includeInstance: boolean, msg: BlockHashAndAmount): BlockHashAndAmount.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BlockHashAndAmount, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BlockHashAndAmount;
    static deserializeBinaryFromReader(message: BlockHashAndAmount, reader: jspb.BinaryReader): BlockHashAndAmount;
}

export namespace BlockHashAndAmount {
    export type AsObject = {
        blockHash: string,
        amount: number,
    }
}

export class SendTransactionRequest extends jspb.Message { 
    getNetworkId(): number;
    setNetworkId(value: number): SendTransactionRequest;
    getPayload(): Uint8Array | string;
    getPayload_asU8(): Uint8Array;
    getPayload_asB64(): string;
    setPayload(value: Uint8Array | string): SendTransactionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendTransactionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendTransactionRequest): SendTransactionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendTransactionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendTransactionRequest;
    static deserializeBinaryFromReader(message: SendTransactionRequest, reader: jspb.BinaryReader): SendTransactionRequest;
}

export namespace SendTransactionRequest {
    export type AsObject = {
        networkId: number,
        payload: Uint8Array | string,
    }
}

export class GetAddressInfoRequest extends jspb.Message { 
    getBlockHash(): string;
    setBlockHash(value: string): GetAddressInfoRequest;
    getAddress(): string;
    setAddress(value: string): GetAddressInfoRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetAddressInfoRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetAddressInfoRequest): GetAddressInfoRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetAddressInfoRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetAddressInfoRequest;
    static deserializeBinaryFromReader(message: GetAddressInfoRequest, reader: jspb.BinaryReader): GetAddressInfoRequest;
}

export namespace GetAddressInfoRequest {
    export type AsObject = {
        blockHash: string,
        address: string,
    }
}

export class GetModuleSourceRequest extends jspb.Message { 
    getBlockHash(): string;
    setBlockHash(value: string): GetModuleSourceRequest;
    getModuleRef(): string;
    setModuleRef(value: string): GetModuleSourceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetModuleSourceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetModuleSourceRequest): GetModuleSourceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetModuleSourceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetModuleSourceRequest;
    static deserializeBinaryFromReader(message: GetModuleSourceRequest, reader: jspb.BinaryReader): GetModuleSourceRequest;
}

export namespace GetModuleSourceRequest {
    export type AsObject = {
        blockHash: string,
        moduleRef: string,
    }
}

export class DumpRequest extends jspb.Message { 
    getFile(): string;
    setFile(value: string): DumpRequest;
    getRaw(): boolean;
    setRaw(value: boolean): DumpRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DumpRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DumpRequest): DumpRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DumpRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DumpRequest;
    static deserializeBinaryFromReader(message: DumpRequest, reader: jspb.BinaryReader): DumpRequest;
}

export namespace DumpRequest {
    export type AsObject = {
        file: string,
        raw: boolean,
    }
}

export class PeersRequest extends jspb.Message { 
    getIncludeBootstrappers(): boolean;
    setIncludeBootstrappers(value: boolean): PeersRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PeersRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PeersRequest): PeersRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PeersRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PeersRequest;
    static deserializeBinaryFromReader(message: PeersRequest, reader: jspb.BinaryReader): PeersRequest;
}

export namespace PeersRequest {
    export type AsObject = {
        includeBootstrappers: boolean,
    }
}

export class GetTransactionStatusInBlockRequest extends jspb.Message { 
    getTransactionHash(): string;
    setTransactionHash(value: string): GetTransactionStatusInBlockRequest;
    getBlockHash(): string;
    setBlockHash(value: string): GetTransactionStatusInBlockRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetTransactionStatusInBlockRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetTransactionStatusInBlockRequest): GetTransactionStatusInBlockRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetTransactionStatusInBlockRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetTransactionStatusInBlockRequest;
    static deserializeBinaryFromReader(message: GetTransactionStatusInBlockRequest, reader: jspb.BinaryReader): GetTransactionStatusInBlockRequest;
}

export namespace GetTransactionStatusInBlockRequest {
    export type AsObject = {
        transactionHash: string,
        blockHash: string,
    }
}

export class BlockHeight extends jspb.Message { 
    getBlockHeight(): string;
    setBlockHeight(value: string): BlockHeight;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BlockHeight.AsObject;
    static toObject(includeInstance: boolean, msg: BlockHeight): BlockHeight.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BlockHeight, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BlockHeight;
    static deserializeBinaryFromReader(message: BlockHeight, reader: jspb.BinaryReader): BlockHeight;
}

export namespace BlockHeight {
    export type AsObject = {
        blockHeight: string,
    }
}
