import {
    AccountTransactionType,
    CcdAmount,
    ContractAddress,
    ContractName,
    Energy,
    ModuleReference,
    ReceiveName,
    SchemaVersion,
    getInitContractParameterSchema,
} from '@concordium/web-sdk';
import { Buffer } from 'buffer/';

import { WalletConnectConnection } from '../src/WalletConnect';
import { moduleSchemaFromBase64 } from '../src/WalletConnection';

jest.mock('@walletconnect/modal', () => ({
    WalletConnectModal: jest.fn(),
}));

jest.mock('../src/constants', () => ({
    CONCORDIUM_WALLET_CONNECT_PROJECT_ID: 'test-project-id',
    DEFAULT_MOBILE_WALLETS: {},
    FULL_WALLET_CONNECT_NAMESPACE_CONFIG: {
        methods: [],
        chains: [],
        events: [],
    },
    MAINNET: {
        name: 'mainnet',
        genesisHash: 'test-mainnet-genesis',
        grpcOpts: undefined,
        ccdScanBaseUrl: 'https://example.com',
    },
    TESTNET: {
        name: 'testnet',
        genesisHash: 'test-testnet-genesis',
        grpcOpts: undefined,
        ccdScanBaseUrl: 'https://example.com',
    },
    WALLET_CONNECT_SESSION_NAMESPACE: 'ccd',
}));

const MODULE_SCHEMA_BASE64 = '//8DAQAAAAQAAAB0ZXN0AQAFAQAAAAcAAAByZWNlaXZlAgUFAA==';

test('InitContract with ModuleSchema sends parameter schema to mobile wallet', async () => {
    const request = jest.fn().mockResolvedValue({
        hash: 'test-hash',
    });

    const connector = {
        client: {
            request,
        },
    } as any;

    const session = {
        topic: 'test-topic',
    } as any;

    const connection = new WalletConnectConnection(connector, 'ccd:testnet', session);

    const initName = ContractName.fromString('test');

    const moduleSchema = moduleSchemaFromBase64(MODULE_SCHEMA_BASE64, SchemaVersion.V1);

    const payload = {
        initName,
        amount: CcdAmount.fromCcd(0),
        maxContractExecutionEnergy: Energy.create(6000n),
        moduleRef: ModuleReference.fromHexString('0000000000000000000000000000000000000000000000000000000000000000'),
    };

    const parameters = 42n;

    await connection.signAndSendTransaction('4dummy-account', AccountTransactionType.InitContract, payload, {
        parameters,
        schema: moduleSchema,
    });

    expect(request).toHaveBeenCalledTimes(1);

    const walletConnectRequest = request.mock.calls[0][0];

    const expectedParameterSchema = getInitContractParameterSchema(
        Uint8Array.from(moduleSchema.value).buffer,
        initName,
        moduleSchema.version
    );

    expect(walletConnectRequest.request.params.schema).toEqual({
        type: 'parameter',
        value: Buffer.from(expectedParameterSchema).toString('base64'),
    });
});

test('InitContract with TypeSchema keeps parameter schema unchanged', async () => {
    const request = jest.fn().mockResolvedValue({
        hash: 'test-hash',
    });

    const connector = {
        client: {
            request,
        },
    } as any;

    const session = {
        topic: 'test-topic',
    } as any;

    const connection = new WalletConnectConnection(connector, 'ccd:testnet', session);

    const initName = ContractName.fromString('test');

    const moduleSchema = moduleSchemaFromBase64(MODULE_SCHEMA_BASE64, SchemaVersion.V1);

    const parameterSchemaBytes = getInitContractParameterSchema(
        Uint8Array.from(moduleSchema.value).buffer,
        initName,
        moduleSchema.version
    );

    const parameterSchema = {
        type: 'TypeSchema' as const,
        value: Buffer.from(parameterSchemaBytes),
    };

    const payload = {
        initName,
        amount: CcdAmount.fromCcd(0),
        maxContractExecutionEnergy: Energy.create(6000n),
        moduleRef: ModuleReference.fromHexString('0000000000000000000000000000000000000000000000000000000000000000'),
    };

    await connection.signAndSendTransaction('4dummy-account', AccountTransactionType.InitContract, payload, {
        parameters: 42n,
        schema: parameterSchema,
    });

    const walletConnectRequest = request.mock.calls[0][0];

    expect(walletConnectRequest.request.params.schema).toEqual({
        type: 'parameter',
        value: Buffer.from(parameterSchemaBytes).toString('base64'),
    });
});

test('UpdateContract with ModuleSchema keeps module schema format', async () => {
    const request = jest.fn().mockResolvedValue({
        hash: 'test-hash',
    });

    const connector = {
        client: {
            request,
        },
    } as any;

    const session = {
        topic: 'test-topic',
    } as any;

    const connection = new WalletConnectConnection(connector, 'ccd:testnet', session);

    const moduleSchema = moduleSchemaFromBase64(MODULE_SCHEMA_BASE64, SchemaVersion.V1);

    const payload = {
        address: ContractAddress.fromSchemaValue({
            index: 0n,
            subindex: 0n,
        }),
        receiveName: ReceiveName.fromString('test.receive'),
        amount: CcdAmount.fromCcd(0),
        maxContractExecutionEnergy: Energy.create(6000n),
    };

    await connection.signAndSendTransaction('4dummy-account', AccountTransactionType.Update, payload, {
        parameters: 42n,
        schema: moduleSchema,
    });

    const walletConnectRequest = request.mock.calls[0][0];

    expect(walletConnectRequest.request.params.schema).toEqual({
        type: 'module',
        value: moduleSchema.value.toString('base64'),
        version: moduleSchema.version,
    });
});
