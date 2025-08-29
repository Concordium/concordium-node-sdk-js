import { execSync } from 'child_process';
import { existsSync } from 'fs';

const protoDir = '../../deps/concordium-base/concordium-grpc-api';

if (!existsSync(protoDir)) {
    console.error('Please checkout submodules before building');
    process.exit(1);
}

try {
    execSync('yarn generate-ts-v2', { stdio: 'inherit' });
    execSync('node scripts/proto-node-esm-compat.js src/grpc-api', { stdio: 'inherit' });
} catch (error) {
    console.error('Error generating TypeScript definitions:', error);
    process.exit(1);
}
