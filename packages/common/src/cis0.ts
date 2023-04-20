import { ContractAddress, HexString } from '.';
import ConcordiumNodeClient from './GRPCClient';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS0 {
    export type StandardIdentifier = string;
    export enum SupportType {
        NoSupport,
        Support,
        SupportBy,
    }
    export type NoSupport = { type: SupportType.NoSupport };
    export type Support = { type: SupportType.Support };
    export type SupportBy = {
        type: SupportType.SupportBy;
        address: ContractAddress;
    };
    export type SupportResult = NoSupport | Support | SupportBy;
}

export function supports(
    client: ConcordiumNodeClient,
    contractAddress: ContractAddress,
    id: CIS0.StandardIdentifier,
    blockHash?: HexString
): Promise<CIS0.SupportResult>;
export function supports(
    client: ConcordiumNodeClient,
    contractAddress: ContractAddress,
    ids: CIS0.StandardIdentifier[],
    blockHash?: HexString
): Promise<CIS0.SupportResult[]>;
export async function supports(
    client: ConcordiumNodeClient,
    contractAddress: ContractAddress,
    ids: CIS0.StandardIdentifier | CIS0.StandardIdentifier[],
    blockHash?: HexString
): Promise<CIS0.SupportResult | CIS0.SupportResult[]> {
    return { type: CIS0.SupportType.Support };
}
