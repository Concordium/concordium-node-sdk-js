import * as ts from 'typescript';

/**
 * Use typescript compiler to typecheck the provided files, fails the test otherwise.
 * @param {string[]} files Typescript files to type check.
 */
export function assertTypeChecks(files: string[]) {
    const program = ts.createProgram(files, {
        noEmit: true,
        target: ts.ScriptTarget.ES2022,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        module: ts.ModuleKind.NodeNext,
    });
    const emitResult = program.emit();

    const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    const errors = allDiagnostics.map((diagnostic) => {
        if (diagnostic.file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            return `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`;
        } else {
            return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        }
    });
    expect(errors).toEqual([]);
    expect(emitResult.emitSkipped).toBeFalsy();
}
