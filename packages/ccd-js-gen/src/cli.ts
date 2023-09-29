/*
This file contains code for building the command line inferface to the ccd-js-gen library.
*/
import { Command } from 'commander';
import packageJson from '../package.json' assert { type: 'json' };
import * as lib from './lib.js';

/** Type representing the CLI options/arguments and needs to match the options set with commander.js */
type Options = {
    /** Smart contract module to generate clients from */
    module: string;
    /** The output directory for the generated code */
    outDir: string;
};

// Main function, which is called be the executable script in `bin`.
export async function main(): Promise<void> {
    const program = new Command();
    program
        .name(packageJson.name)
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
        .parse(process.argv);
    const options = program.opts<Options>();
    console.log('Generating smart contract clients...');

    const startTime = Date.now();
    await lib.generateContractClientsFromFile(options.module, options.outDir, {
        onProgress(update) {
            if (update.type === 'Progress') {
                console.log(
                    `[${update.doneItems}/${update.totalItems}] ${update.spentTime}ms`
                );
            }
        },
    });

    console.log(`Done in ${Date.now() - startTime}ms`);
}
