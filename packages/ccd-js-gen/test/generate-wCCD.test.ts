import * as Gen from '../src/lib.js';
import { assertTypeChecks } from './testHelpers.js';

const moduleFileName = 'wCCD';
const moduleFilePath = `${__dirname}/resources/${moduleFileName}.wasm.v1`;
const outDir = `${__dirname}/lib`;
const outModuleFile = `${outDir}/${moduleFileName}`;
const outContractFile = `${outDir}/${moduleFileName}_cis2_wCCD`;

beforeAll(() => {
    return Gen.generateContractClientsFromFile(moduleFilePath, outDir, {
        output: 'Everything',
    });
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
        expect(module.instantiateCis2WCCD).toBeDefined();
    });

    test('Exports functions based on schema', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(`${outModuleFile}.js`);
        expect(module.createCis2WCCDParameter).toBeDefined();
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

        expect(module.sendWrap).toBeDefined();
        expect(module.dryRunWrap).toBeDefined();
        expect(module.sendTransfer).toBeDefined();
        expect(module.dryRunTransfer).toBeDefined();
    });

    test('Exports functions based on schema', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(`${outContractFile}.js`);
        expect(module.parseEvent).toBeDefined();
        expect(module.createUnwrapParameter).toBeDefined();
        expect(module.parseErrorMessageUnwrap).toBeDefined();
        expect(module.createTransferParameter).toBeDefined();
        expect(module.parseErrorMessageTransfer).toBeDefined();
    });
});
