/*
 * This file contains tests for generating clients for the smart contract module 'test-bench'
 * located at https://github.com/Concordium/concordium-misc-tools/tree/main/wallet-connect-test-bench/smart-contract
 *
 * The tests will run the client generator, typecheck the generated files and ensure the files
 * exposes relevant functions.
 *
 * These tests depends on the smart contract module being a file with path:
 *
 *   test/resources/test-bench.wasm.v1
 *
 * Which can be built from the above linked project using `cargo-concordium`:
 *
 * ```
 * cargo concordium build --schema-embed --out ./path/to/test/resources/test-bench.wasm.v1
 * ```
 */
import * as Gen from '../src/lib.js';
import { assertTypeChecks } from './testHelpers.js';

const outDir = __dirname + '/lib';
const outModuleFile = `${outDir}/test-bench`;
const outContractFile = `${outDir}/test-bench_smart_contract_test_bench`;

beforeAll(() => {
    return Gen.generateContractClientsFromFile(__dirname + '/resources/test-bench.wasm.v1', outDir, {
        output: 'Everything',
    });
}, 60_000);

describe('Generated module client file', () => {
    test('Type checks', () => {
        assertTypeChecks([`${outModuleFile}.ts`]);
    });

    test('Exports basic functions based on wasm', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(`${outModuleFile}.js`);

        expect(module.create).toBeDefined();
        expect(module.createUnchecked).toBeDefined();
        expect(module.checkOnChain).toBeDefined();
        expect(module.getModuleSource).toBeDefined();
    });

    test('Exports module specific functions based on wasm', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(`${outModuleFile}.js`);
        expect(module.instantiateSmartContractTestBench).toBeDefined();
    });

    test('Exports functions based on schema', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(`${outModuleFile}.js`);
        expect(module.createSmartContractTestBenchParameter).toBeDefined();
    });
});

describe('Generated contract client file', () => {
    test('Type checks', () => {
        assertTypeChecks([`${outContractFile}.ts`]);
    });

    test('Exports basic functions based on wasm module', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(`${outContractFile}.js`);

        expect(module.create).toBeDefined();
        expect(module.createUnchecked).toBeDefined();
        expect(module.checkOnChain).toBeDefined();
    });

    test('Exports contract specific functions based on wasm module', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(`${outContractFile}.js`);

        expect(module.sendSetU8).toBeDefined();
        expect(module.dryRunSetU8).toBeDefined();
        expect(module.sendSetU8Payable).toBeDefined();
        expect(module.dryRunSetU8Payable).toBeDefined();
    });

    test('Exports functions based on schema', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(`${outContractFile}.js`);
        expect(module.parseEvent).not.toBeDefined();
        expect(module.createSetU8Parameter).toBeDefined();
        expect(module.createSetU8PayableParameter).toBeDefined();
        expect(module.parseErrorMessageSetU8).toBeDefined();
    });
});
