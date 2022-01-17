import * as fs from 'fs';
export function getModuleBuffer(filePath: string): Buffer {
    return fs.readFileSync(filePath);
}
