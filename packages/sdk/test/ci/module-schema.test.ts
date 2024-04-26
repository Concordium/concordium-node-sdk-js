import * as fs from 'fs';
import * as path from 'path';
import {
    getEmbeddedModuleSchema,
    versionedModuleSourceFromBuffer,
} from '../../src/types/VersionedModuleSource.js';

// Directory with smart contract modules and schemas for testing.
const testFileDir = path.resolve(
    '../../deps/concordium-base/smart-contracts/testdata/schemas'
);

describe('VersionedModuleSource: getEmbeddedModuleSchema', () => {
    test('Smart contract module v1 with versioned schema', async () => {
        const contractModule = fs.readFileSync(
            path.join(
                testFileDir,
                'cis2-wccd-embedded-schema-v1-versioned.wasm.v1'
            )
        );
        const moduleSource = versionedModuleSourceFromBuffer(contractModule);
        const moduleSchema = getEmbeddedModuleSchema(moduleSource);
        if (moduleSchema === undefined) {
            fail('Failed to find module schame');
        }
        expect(moduleSchema.type).toBe('versioned');
    });

    test('Smart contract module v0 with versioned schema', async () => {
        const contractModule = fs.readFileSync(
            path.join(
                testFileDir,
                'cis1-wccd-embedded-schema-v0-versioned.wasm.v0'
            )
        );
        const moduleSource = versionedModuleSourceFromBuffer(contractModule);
        const moduleSchema = getEmbeddedModuleSchema(moduleSource);
        if (moduleSchema === undefined) {
            fail('Failed to find module schame');
        }
        expect(moduleSchema.type).toBe('versioned');
    });

    test('Smart contract module v0 with unversioned schema', async () => {
        const unversionedContractModule = fs.readFileSync(
            path.join(
                testFileDir,
                'cis1-wccd-embedded-schema-v0-unversioned.wasm'
            )
        );
        const moduleSource = {
            version: 0,
            source: Buffer.from(unversionedContractModule),
        } as const;
        const moduleSchema = getEmbeddedModuleSchema(moduleSource);
        if (moduleSchema === undefined) {
            fail('Failed to find module schame');
        }
        expect(moduleSchema.type).toBe('unversioned');
    });

    test('Smart contract module v1 with unversioned schema', async () => {
        const contractModule = fs.readFileSync(
            path.join(
                testFileDir,
                'cis2-wccd-embedded-schema-v1-unversioned.wasm.v1'
            )
        );
        const moduleSource = versionedModuleSourceFromBuffer(contractModule);
        const moduleSchema = getEmbeddedModuleSchema(moduleSource);
        if (moduleSchema === undefined) {
            fail('Failed to find module schame');
        }
        expect(moduleSchema.type).toBe('unversioned');
    });
});
