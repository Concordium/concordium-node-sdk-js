import { Buffer } from 'buffer/';
import fs from 'fs';
import { deserialModuleFromBuffer } from '../src/deserializeSchema';
import { SchemaVersion } from '../src/types';

test('Deserialize V0 schema from file (two-step-transfer)', async () => {
    const rawModule = Buffer.from(
        fs.readFileSync('./test/resources/two-step-transfer-schema.bin')
    );
    const parsedModule = deserialModuleFromBuffer(rawModule, SchemaVersion.V0);

    const contractName = 'two-step-transfer';

    if (parsedModule.v != SchemaVersion.V0) {
        throw new Error('Unexpected schema version');
    }

    expect(parsedModule.value[contractName].state).toBeDefined();
    expect(parsedModule.value[contractName].init).toBeDefined();
    expect(parsedModule.value[contractName].receive).toBeDefined();
});

test('Deserialize V1 schema from file (icecream)', async () => {
    const rawModule = Buffer.from(
        fs.readFileSync('./test/resources/icecream-schema.bin')
    );
    const parsedModule = deserialModuleFromBuffer(rawModule, SchemaVersion.V1);

    const contractName = 'icecream';

    expect(parsedModule.value[contractName].init).toBeDefined();
    expect(parsedModule.value[contractName].receive).toBeDefined();
});

test('Deserialize V0 versioned schema from file (cis1-wccd)', async () => {
    const rawModule = Buffer.from(
        fs.readFileSync('./test/resources/cis1-wccd-schema-v0-versioned.bin')
    );
    const parsedModule = deserialModuleFromBuffer(rawModule);

    const contractName = 'CIS1-wCCD';

    if (parsedModule.v != SchemaVersion.V0) {
        throw new Error('Unexpected schema version');
    }

    expect(parsedModule.value[contractName].state).toBeDefined();
    expect(parsedModule.value[contractName].init).toBeDefined();
    expect(parsedModule.value[contractName].receive).toBeDefined();
});

test('Deserialize V1 versioned schema from file (cis2-wccd)', async () => {
    const rawModule = Buffer.from(
        fs.readFileSync('./test/resources/cis2-wccd-schema-v1-versioned.bin')
    );
    const parsedModule = deserialModuleFromBuffer(rawModule);

    const contractName = 'CIS2-wCCD';

    if (parsedModule.v != SchemaVersion.V1) {
        throw new Error('Unexpected schema version');
    }

    expect(parsedModule.value[contractName].init).toBeDefined();
    expect(parsedModule.value[contractName].receive).toBeDefined();
});

test('Deserialize V2 versioned schema from file (auction)', async () => {
    const rawModule = Buffer.from(
        fs.readFileSync('./test/resources/auction-with-errors-schema.bin')
    );
    const parsedModule = deserialModuleFromBuffer(rawModule);

    const contractName = 'auction';

    if (parsedModule.v != SchemaVersion.V2) {
        throw new Error('Unexpected schema version');
    }

    expect(parsedModule.value[contractName].init).toBeDefined();
    expect(parsedModule.value[contractName].receive).toBeDefined();
    expect(
        parsedModule.value[contractName].receive.finalize.error
    ).toBeDefined();
});
