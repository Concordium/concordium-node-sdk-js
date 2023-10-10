/*
This file contains code for building the command line inferface to the ccd-js-gen library.
*/
import { Command } from 'commander';
import packageJson from '../package.json';
import * as lib from './lib';

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
    await lib.generateContractClientsFromFile(options.module, options.outDir);
}
