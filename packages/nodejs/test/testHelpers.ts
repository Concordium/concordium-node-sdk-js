/* eslint-disable import/no-extraneous-dependencies */
import * as fs from 'fs';
import { credentials } from '@grpc/grpc-js';
import {
    AccountAddress,
    ContractAddress,
    IdentityInput,
} from '@concordium/common-sdk';
import { ConcordiumGRPCClient } from '@concordium/common-sdk/grpc';
import {
    decryptMobileWalletExport,
    EncryptedData,
} from '../src/wallet/crypto.js';
import { MobileWalletExport } from '../src/wallet/types.js';
import { createConcordiumClient } from '../src/clientV2.js';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';

// This makes sure the necessary types are added to `globalThis`
import 'isomorphic-fetch';

export { getModuleBuffer } from '../src/util.js';

const TESTNET_NODE = 'node.testnet.concordium.com';
const GRPCV2_PORT = 20000;

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

type OverrideCheck<A> = {
    when: (a: unknown) => boolean;
    check: (l: A, r: A) => boolean;
};

const checkBuffers: OverrideCheck<ArrayBuffer> = {
    when(u) {
        return u instanceof ArrayBuffer;
    },
    check(l, r) {
        if (l.byteLength !== r.byteLength) {
            return false;
        }
        const lu8 = new Uint8Array(l);
        const ru8 = new Uint8Array(r);
        for (let i = 0; i < l.byteLength; i++) {
            if (lu8.at(i) !== ru8.at(i)) {
                return false;
            }
        }
        return true;
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const equalOverrides: OverrideCheck<any>[] = [
    {
        when: AccountAddress.isAccountAddress,
        check: AccountAddress.equals,
    },
    { when: ContractAddress.isContractAddress, check: ContractAddress.equals },
    checkBuffers,
];

export function expectToEqual<A = unknown>(value: A, expected: A) {
    const override = equalOverrides.find(({ when: guard }) => guard(expected));
    if (override !== undefined) {
        if (!override.when(value)) {
            throw new Error(`Expected: ${expected} instead got ${value}`);
        }
        expect(override.check(value, expected)).toBeTruthy();
    } else if (Array.isArray(expected)) {
        if (!Array.isArray(value) || value.length !== expected.length) {
            throw new Error(`Expected: ${expected} instead got ${value}`);
        }
        for (let i = 0; i < expected.length; i++) {
            expectToEqual(value[i], expected[i]);
        }
    } else if (typeof expected === 'object' && expected !== null) {
        for (const key of Object.keys(expected)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expectToEqual(value[key], expected[key]);
        }
    } else {
        if (value !== expected) {
            expect(value).toBe(expected);
        }
    }
}
