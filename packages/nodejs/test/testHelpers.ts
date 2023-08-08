/* eslint-disable import/no-extraneous-dependencies */
import * as fs from 'fs';
import { credentials, Metadata } from '@grpc/grpc-js/';
import { IdentityInput } from '@concordium/common-sdk';
import { ConcordiumGRPCClient } from '@concordium/common-sdk/grpc';
import { decryptMobileWalletExport, EncryptedData } from '../src/wallet/crypto';
import { MobileWalletExport } from '../src/wallet/types';
import { createConcordiumClient } from '../src/clientV2';
import ConcordiumNodeClient from '../src/client';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';

// This makes sure the necessary types are added to `globalThis`
import 'isomorphic-fetch';

export { getModuleBuffer } from '../src/util';

const TESTNET_NODE = 'node.testnet.concordium.com';
const GRPCV1_PORT = 10000;
const GRPCV2_PORT = 20000;

/**
 * Creates a gRPC v1 client (for nodeJS) to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClient(
    address = TESTNET_NODE,
    port = GRPCV1_PORT
): ConcordiumNodeClient {
    const metadata = new Metadata();
    metadata.add('authentication', 'rpcadmin');
    return new ConcordiumNodeClient(
        address,
        port,
        credentials.createInsecure(),
        metadata,
        15000
    );
}

/**
 * Creates a gRPC v2 client (for nodeJS) to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClientV2(
    address = TESTNET_NODE,
    port = GRPCV2_PORT
): ConcordiumGRPCClient {
    return createConcordiumClient(address, port, credentials.createInsecure(), {
        timeout: 15000,
    });
}

// TODO find nice way to move this to web/common
/**
 * Creates a gRPC v2 client (for web) to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClientWeb(
    address = 'http://node.testnet.concordium.com',
    port = GRPCV2_PORT
): ConcordiumGRPCClient {
    const transport = new GrpcWebFetchTransport({
        baseUrl: `${address}:${port}`,
        timeout: 15000,
    });
    return new ConcordiumGRPCClient(transport);
}

export function isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
}

export function getIdentityInput(): IdentityInput {
    const rawData = fs.readFileSync(
        './test/resources/mobileWalletExport.json',
        'utf8'
    );
    const mobileWalletExport: EncryptedData = JSON.parse(rawData);
    const decrypted: MobileWalletExport = decryptMobileWalletExport(
        mobileWalletExport,
        '123123'
    );
    const identity = decrypted.value.identities[0];
    const identityInput: IdentityInput = {
        identityProvider: identity.identityProvider,
        identityObject: identity.identityObject,
        idCredSecret:
            identity.privateIdObjectData.aci.credentialHolderInformation
                .idCredSecret,
        prfKey: identity.privateIdObjectData.aci.prfKey,
        randomness: identity.privateIdObjectData.randomness,
    };
    return identityInput;
}
