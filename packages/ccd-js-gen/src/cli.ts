/*
This file contains code for building the command line inferface to the ccd-js-gen library.
*/
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Command } from 'commander';
import * as lib from './lib.js';

/** Type representing the CLI options/arguments and needs to match the options set with commander.js */
type Options = {
    /** Smart contract module to generate clients from */
    module: string;
    /** The output directory for the generated code */
    outDir: string;
    /** The output file types for the generated code */
    outputType: lib.OutputOptions;
    /** Generate `// @ts-nocheck` annotations in each file. */
    tsNocheck: boolean;
};

// Main function, which is called in the executable script in `bin`.
export async function main(): Promise<void> {
    // Read package.json for version and description:
    const scriptPath = fileURLToPath(import.meta.url);
    const binFolder = path.parse(scriptPath).dir;
    const cliPath = pathToFileURL(
        path.resolve(binFolder, '..', '..', 'package.json')
    );
    const packageJson: { version: string; description: string } = await fs
        .readFile(cliPath, 'utf-8')
        .then(JSON.parse);

    const program = new Command();
    program
        .name('ccd-js-gen')
        .description(packageJson.description)
        .version(packageJson.version)
        .requiredOption(
            '-m, --module <module-file>',
            'Smart contract module to generate clients from'
        )
        .requiredOption(
            '-o, --out-dir <directory>',
            'The output directory for the generated code'
        )
        .option<lib.OutputOptions>(
            '-t, --output-type <TypeScript|JavaScript|TypedJavaScript|Everything>',
            'The output file types for the generated code.',
            (value: string) => {
                switch (value) {
                    case 'TypeScript':
                    case 'JavaScript':
                    case 'TypedJavaScript':
                    case 'Everything':
                        return value;
                    default:
                        // Exit in case `value` is not a valid OutputOptions.
                        console.error(
                            `Invalid '--output-type' flag: ${value}. Use 'TypeScript', 'JavaScript', 'TypedJavaScript', or 'Everything'.`
                        );
                        process.exit(1);
                }
            },
            'Everything'
        )
        .option(
            '-n, --ts-nocheck',
            'Generate `@ts-nocheck` annotations at the top of each typescript file.',
            false
        )
        .parse(process.argv);
    const options = program.opts<Options>();
    console.log('Generating smart contract clients...');

    const startTime = Date.now();
    await lib.generateContractClientsFromFile(options.module, options.outDir, {
        output: options.outputType,
        tsNocheck: options.tsNocheck,
        onProgress(update) {
            if (update.type === 'Progress') {
                console.log(
                    `[${update.doneItems}/${update.totalItems}] ${update.spentTime}ms `.padEnd(
                        15,
                        ' '
                    ) + update.description
                );
            }
        },
    });

    console.log(`Done in ${Date.now() - startTime}ms`);
}
