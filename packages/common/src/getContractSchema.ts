const customSectionString = 'concordium-schema-v1';
const customSectionStringLength = customSectionString.length;

export function getContractSchemaString(schemaStr: string): Buffer {
    const getEndIndex = schemaStr.length;
    const getStartindex = getBytePos(schemaStr);
    const contractSchema: string = schemaStr.substring(
        getStartindex + customSectionStringLength,
        getEndIndex
    );
    return Buffer.from(contractSchema);
}

function getBytePos(pdfStr: string): number {
    const byteRangePos = getSubstringIndex(pdfStr, customSectionString, 1);
    if (byteRangePos === -1) {
        throw new Error('Failed to locate ByteRange.');
    }
    return byteRangePos;
}

export function getSubstringIndex(
    str: string,
    substring: string,
    n: number
): number {
    let times = 0;
    let index = 0;

    while (times < n && index !== -1) {
        index = str.indexOf(substring, index + 1);
        times++;
    }

    return index;
}
