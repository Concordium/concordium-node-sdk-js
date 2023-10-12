import * as Gen from '../src/lib.js';
import { assertTypeChecks } from './testHelpers.js';

const outDir = __dirname + '/lib';
const outModuleFile = `${outDir}/test-bench`;
const outContractFile = `${outDir}/test-bench_smart_contract_test_bench`;

beforeAll(() => {
    return Gen.generateContractClientsFromFile(
        __dirname + '/resources/test-bench.wasm.v1',
        outDir,
        { output: 'Everything' }
    );
}, 30_000);

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
