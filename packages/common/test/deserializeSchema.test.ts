import {
    deserialModuleFromBuffer,
    getModuleBuffer,
} from '../src/deserializeSchema';

test('Deserialize V0 schema from file (two-step-transfer)', async () => {
    const rawModule = getModuleBuffer(
        './test/resources/two-step-transfer-schema.bin'
    );
    const parsedModule = deserialModuleFromBuffer(rawModule, 0);

    const contractName = 'two-step-transfer';

    expect(parsedModule[contractName].state).toBeDefined();
    expect(parsedModule[contractName].init).toBeDefined();
    expect(parsedModule[contractName].receive).toBeDefined();
});

test('Deserialize V1 schema from file (icecream)', async () => {
    const rawModule = getModuleBuffer(
        './test/resources/schemaFiles/icecream-schema.bin'
    );
    const parsedModule = deserialModuleFromBuffer(rawModule, 1);

    const contractName = 'icecream';

    expect(parsedModule[contractName].init).toBeDefined();
    expect(parsedModule[contractName].receive).toBeDefined();
});
