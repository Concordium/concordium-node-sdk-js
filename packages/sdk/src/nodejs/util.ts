import fs from 'node:fs';

/**
 * Loads the module as a buffer, given the given filePath.
 * @param filePath the location of the module
 * @returns the module as a buffer
 */
export function getModuleBuffer(filePath: string): Buffer {
    return Buffer.from(fs.readFileSync(filePath));
}
