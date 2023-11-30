#!/usr/bin/env node

/**
 * This file executes the `main` function in the `cli` file of the project.
 *
 * The execution immediately spawns a child process with node to get around some platform-specific issues.
 * See https://github.com/Concordium/concordium-node-sdk-js/pull/315 for more details.
 * */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { pathToFileURL } from 'node:url';

// Find the path to this script and resolve any symlinks.
// Then use it to locate and execute the `cli.js` file while forwarding all arguments.
const scriptPath = fileURLToPath(import.meta.url);
const binFolder = path.parse(scriptPath).dir;
const cliPath = pathToFileURL(path.join(binFolder, "..", "lib", "src", "cli.js"));
const node = spawn('node', ['--no-warnings', '-e', `import("${cliPath}").then(cli => cli.main())`, "--", ...process.argv]);

// Forward stdout from child process.
node.stdout.on('data', (data) => {
    console.log(`${data}`);
});

// Forward stderr from child process.
node.stderr.on('data', (data) => {
    console.error(`${data}`);
});

// Forward exit codes from child process.
node.on('close', (code) => {
    process.exit(code);
});
>>>>>>> Stashed changes
