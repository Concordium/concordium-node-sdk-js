import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as tsm from 'ts-morph';
import * as SDK from '@concordium/common-sdk';
import { Buffer } from 'buffer/';

/**
 * Output options for the generated code.
 * - 'TypeScript' Only produce a module in TypeScript.
 * - 'JavaScript' Only produce a module in JavaScript.
 * - 'TypedJavaScript' Produce a JavaScript module and TypeScript declarations.
 * - 'Everything' Produce all of the above.
 */
export type OutputOptions =
    | 'TypeScript'
    | 'JavaScript'
    | 'TypedJavaScript'
    | 'Everything';

/** Options for generating clients */
export type GenerateContractClientsOptions = {
    /** Options for the output */
    output?: OutputOptions;
};

/**
 * Generate smart contract client code for a given smart contract module file.
 * @param modulePath Path to the smart contract module.
 * @param outDirPath Path to the directory to use for the output.
 * @param options Options for generating the clients.
 * @throws If unable to: read provided file at `modulePath`, parse the provided smart contract module or write to provided directory `outDirPath`.
 */
export async function generateContractClientsFromFile(
    modulePath: string,
    outDirPath: string,
    options: GenerateContractClientsOptions = {}
): Promise<void> {
    const fileBytes = await fs.readFile(modulePath).catch((e) => {
        if ('code' in e && e.code === 'ENOENT') {
            throw new Error(`No such module '${modulePath}'`);
        }
        throw e;
    });
    const outputName = path.basename(modulePath, '.wasm.v1');
    const scModule = SDK.Module.fromRawBytes(Buffer.from(fileBytes));
    return generateContractClients(scModule, outputName, outDirPath, options);
}

/**
 * Generate smart contract client code for a given smart contract module.
 * @param scModule Buffer with bytes for the smart contract module.
 * @param outName Name for the output file.
 * @param outDirPath Path to the directory to use for the output.
 * @param options Options for generating the clients.
 * @throws If unable to write to provided directory `outDirPath`.
 */
export async function generateContractClients(
    scModule: SDK.Module,
    outName: string,
    outDirPath: string,
    options: GenerateContractClientsOptions = {}
): Promise<void> {
    const outputOption = options.output ?? 'Everything';
    const outputFilePath = path.format({
        dir: outDirPath,
        name: outName,
        ext: '.ts',
    });

    const compilerOptions: tsm.CompilerOptions = {
        outDir: outDirPath,
        declaration:
            outputOption === 'Everything' || outputOption === 'TypedJavaScript',
    };
    const project = new tsm.Project({ compilerOptions });
    const sourceFile = project.createSourceFile(outputFilePath, '', {
        overwrite: true,
    });
    await addModuleClients(sourceFile, scModule);
    if (outputOption === 'Everything' || outputOption === 'TypeScript') {
        await project.save();
    }
    if (
        outputOption === 'Everything' ||
        outputOption === 'JavaScript' ||
        outputOption === 'TypedJavaScript'
    ) {
        await project.emit();
    }
}

/** Iterates a module interface adding code to the provided source file. */
async function addModuleClients(
    sourceFile: tsm.SourceFile,
    scModule: SDK.Module
) {
    const moduleInterface = await scModule.parseModuleInterface();
    const moduleRef = await scModule.getModuleRef();
    const grpcClientId = 'grpcClient';
    const moduleRefId = 'moduleReference';
    const moduleClientId = 'ModuleClient';
    const deployedModuleId = 'deployedModule';

    sourceFile.addImportDeclaration({
        namespaceImport: 'SDK',
        moduleSpecifier: '@concordium/common-sdk',
    });

    sourceFile.addVariableStatement({
        isExported: true,
        declarationKind: tsm.VariableDeclarationKind.Const,
        declarations: [
            {
                type: 'SDK.ModuleReference',
                initializer: `new SDK.ModuleReference('${moduleRef.moduleRef}')`,
                name: moduleRefId,
            },
        ],
    });

    const moduleClassDecl = sourceFile.addClass({
        docs: [
            'Smart contract module client, can be used for instantiating new smart contract instance on chain.',
        ],
        isExported: true,
        name: moduleClientId,
        properties: [
            {
                docs: ['The reference of this module.'],
                isStatic: true,
                scope: tsm.Scope.Public,
                name: moduleRefId,
                initializer: moduleRefId,
            },
            {
                docs: ['The gRPC connection used by this client.'],
                scope: tsm.Scope.Public,
                name: grpcClientId,
                type: 'SDK.ConcordiumGRPCClient',
            },
            {
                docs: ['Generic smart contract module used internally.'],
                scope: tsm.Scope.Private,
                name: deployedModuleId,
                type: 'SDK.DeployedModule',
            },
        ],
    });
    moduleClassDecl.addConstructor({
        docs: [
            'Private constructor to enforce creating objects using a static method.',
        ],
        scope: tsm.Scope.Private,
        parameters: [
            {
                name: grpcClientId,
                type: 'SDK.ConcordiumGRPCClient',
            },
            {
                name: deployedModuleId,
                type: 'SDK.DeployedModule',
            },
        ],
    }).setBodyText(`this.${grpcClientId} = ${grpcClientId};
this.${deployedModuleId} = ${deployedModuleId};`);

    moduleClassDecl
        .addMethod({
            docs: [
                `Construct the \`${moduleClientId}\` for interacting with a module on chain.
Checks and throws an error if the module is not deployed on chain.`,
            ],
            scope: tsm.Scope.Public,
            isStatic: true,
            isAsync: true,
            name: 'create',
            parameters: [
                {
                    name: grpcClientId,
                    type: 'SDK.ConcordiumGRPCClient',
                },
            ],
            returnType: `Promise<${moduleClientId}>`,
        })
        .setBodyText(
            `return new ${moduleClientId}(
    ${grpcClientId},
    await SDK.DeployedModule.create(${grpcClientId}, ${moduleClientId}.${moduleRefId}),
);`
        );
    moduleClassDecl
        .addMethod({
            docs: [
                `Construct the \`${moduleClientId}\` for interacting with a module on chain.
The caller must ensure the module is deployed on chain.`,
            ],
            scope: tsm.Scope.Public,
            isStatic: true,
            name: 'createUnchecked',
            parameters: [
                {
                    name: grpcClientId,
                    type: 'SDK.ConcordiumGRPCClient',
                },
            ],
            returnType: moduleClientId,
        })
        .setBodyText(
            `return new ${moduleClientId}(
    ${grpcClientId},
    SDK.DeployedModule.createUnchecked(${grpcClientId}, ${moduleClientId}.${moduleRefId}),
);`
        );

    const blockHashId = 'blockHash';
    moduleClassDecl
        .addMethod({
            docs: ['Check if this module is deployed to the chain'],
            scope: tsm.Scope.Public,
            name: 'checkOnChain',
            parameters: [
                {
                    name: blockHashId,
                    hasQuestionToken: true,
                    type: 'string',
                },
            ],
            returnType: 'Promise<void>',
        })
        .setBodyText(
            `return this.${deployedModuleId}.checkOnChain(${blockHashId});`
        );

    moduleClassDecl
        .addMethod({
            docs: [
                'Get the module source of the deployed smart contract module.',
            ],
            scope: tsm.Scope.Public,
            name: 'getModuleSource',
            parameters: [
                {
                    name: blockHashId,
                    hasQuestionToken: true,
                    type: 'string',
                },
            ],
            returnType: 'Promise<SDK.VersionedModuleSource>',
        })
        .setBodyText(
            `return this.${deployedModuleId}.getModuleSource(${blockHashId});`
        );

    for (const contract of moduleInterface.values()) {
        const contractNameId = 'contractName';
        const genericContractId = 'genericContract';
        const contractAddressId = 'contractAddress';
        const dryRunId = 'dryRun';
        const contractClassId = toPascalCase(contract.contractName);
        const contractDryRunClassId = `${contractClassId}DryRun`;
        const initContractId = `init${contractClassId}`;

        const transactionMetadataId = 'transactionMetadata';
        const parameterId = 'parameter';
        const signerId = 'signer';

        moduleClassDecl
            .addMethod({
                docs: [
                    `Send transaction for instantiating a new '${contract.contractName}' smart contract instance.`,
                ],
                scope: tsm.Scope.Public,
                name: initContractId,
                parameters: [
                    {
                        name: transactionMetadataId,
                        type: 'SDK.ContractTransactionMetadata',
                    },
                    {
                        name: parameterId,
                        type: 'SDK.HexString',
                    },
                    {
                        name: signerId,
                        type: 'SDK.AccountSigner',
                    },
                ],
                returnType: 'Promise<SDK.HexString>',
            })
            .setBodyText(
                `return this.${deployedModuleId}.createAndSendInitTransaction(
    '${contract.contractName}',
    SDK.encodeHexString,
    ${transactionMetadataId},
    ${parameterId},
    ${signerId}
);`
            );

        const contractClassDecl = sourceFile.addClass({
            docs: ['Smart contract client for a contract instance on chain.'],
            isExported: true,
            name: contractClassId,
            properties: [
                {
                    docs: [
                        'The reference of the module used by this contract.',
                    ],
                    isStatic: true,
                    isReadonly: true,
                    scope: tsm.Scope.Public,
                    name: moduleRefId,
                    initializer: moduleRefId,
                },
                {
                    docs: [
                        'Name of the smart contract supported by this client.',
                    ],
                    scope: tsm.Scope.Public,
                    isStatic: true,
                    isReadonly: true,
                    name: contractNameId,
                    type: 'string',
                    initializer: `'${contract.contractName}'`,
                },
                {
                    docs: ['The gRPC connection used by this client.'],
                    scope: tsm.Scope.Public,
                    name: grpcClientId,
                    type: 'SDK.ConcordiumGRPCClient',
                },
                {
                    docs: ['The contract address used by this client.'],
                    scope: tsm.Scope.Public,
                    isReadonly: true,
                    name: contractAddressId,
                    type: 'SDK.ContractAddress',
                },
                {
                    docs: ['Dry run entrypoints of the smart contract.'],
                    scope: tsm.Scope.Public,
                    isReadonly: true,
                    name: dryRunId,
                    type: contractDryRunClassId,
                },
                {
                    docs: ['Generic contract client used internally.'],
                    scope: tsm.Scope.Private,
                    isReadonly: true,
                    name: genericContractId,
                    type: 'SDK.Contract',
                },
            ],
        });

        const dryRunClassDecl = sourceFile.addClass({
            docs: [
                `Smart contract client for dry running messages to a contract instance of '${contract.contractName}' on chain.`,
            ],
            isExported: true,
            name: contractDryRunClassId,
        });

        contractClassDecl
            .addConstructor({
                docs: [
                    'Private constructor to enforce creating objects using a static method.',
                ],
                scope: tsm.Scope.Private,
                parameters: [
                    {
                        name: grpcClientId,
                        type: 'SDK.ConcordiumGRPCClient',
                    },
                    {
                        name: contractAddressId,
                        type: 'SDK.ContractAddress',
                    },
                    {
                        name: genericContractId,
                        type: 'SDK.Contract',
                    },
                    {
                        name: dryRunId,
                        type: contractDryRunClassId,
                    },
                ],
            })
            .setBodyText(
                `this.${grpcClientId} = ${grpcClientId};
this.${contractAddressId} = ${contractAddressId};
this.${genericContractId} = ${genericContractId};
this.${dryRunId} = ${dryRunId};`
            );
        contractClassDecl
            .addMethod({
                docs: [
                    `Construct the \`${contractClassId}\` for interacting with a '${contract.contractName}' contract on chain.
Checking the information instance on chain at the last finalized block.`,
                ],
                isStatic: true,
                isAsync: true,
                scope: tsm.Scope.Public,
                name: 'create',
                parameters: [
                    {
                        name: grpcClientId,
                        type: 'SDK.ConcordiumGRPCClient',
                    },
                    {
                        name: contractAddressId,
                        type: 'SDK.ContractAddress',
                    },
                ],
                returnType: `Promise<${contractClassId}>`,
            })
            .setBodyText(
                `const ${genericContractId} = new SDK.Contract(${grpcClientId}, ${contractAddressId}, ${contractClassId}.${contractNameId});
await ${genericContractId}.checkOnChain({ moduleReference: ${moduleRefId} });
return new ${contractClassId}(
    ${grpcClientId},
    ${contractAddressId},
    ${genericContractId},
    new ${contractDryRunClassId}(${genericContractId})
);`
            );

        contractClassDecl
            .addMethod({
                docs: [
                    `Construct the \`${contractClassId}\` for interacting with a '${contract.contractName}' contract on chain.
Without checking the instance information on chain.`,
                ],
                isStatic: true,
                scope: tsm.Scope.Public,
                name: 'createUnchecked',
                parameters: [
                    {
                        name: grpcClientId,
                        type: 'SDK.ConcordiumGRPCClient',
                    },
                    {
                        name: contractAddressId,
                        type: 'SDK.ContractAddress',
                    },
                ],
                returnType: contractClassId,
            })
            .setBodyText(
                `const ${genericContractId} = new SDK.Contract(${grpcClientId}, ${contractAddressId}, ${contractClassId}.${contractNameId});
return new ${contractClassId}(
    ${grpcClientId},
    ${contractAddressId},
    ${genericContractId},
    new ${contractDryRunClassId}(${genericContractId})
);`
            );

        dryRunClassDecl.addConstructor({
            docs: ['Contruct a client for a contract instance on chain'],
            parameters: [
                {
                    name: genericContractId,
                    type: 'SDK.Contract',
                    scope: tsm.Scope.Private,
                },
            ],
        });

        for (const entrypointName of contract.entrypointNames) {
            const transactionMetadataId = 'transactionMetadata';
            const parameterId = 'parameter';
            const signerId = 'signer';
            contractClassDecl
                .addMethod({
                    docs: [
                        `Send an update-contract transaction to the '${entrypointName}' entrypoint of the '${contract.contractName}' contract.

@param {SDK.ContractTransactionMetadata} ${transactionMetadataId} - Hex encoded parameter for entrypoint
@param {SDK.HexString} ${parameterId} - Hex encoded parameter for entrypoint
@param {SDK.AccountSigner} ${signerId} - The signer of the update contract transaction.

@throws If the entrypoint is not successfully invoked.

@returns {SDK.HexString} Transaction hash`,
                    ],
                    scope: tsm.Scope.Public,
                    name: toCamelCase(entrypointName),
                    parameters: [
                        {
                            name: transactionMetadataId,
                            type: 'SDK.ContractTransactionMetadata',
                        },
                        {
                            name: parameterId,
                            type: 'SDK.HexString',
                        },
                        {
                            name: signerId,
                            type: 'SDK.AccountSigner',
                        },
                    ],
                    returnType: 'Promise<SDK.HexString>',
                })
                .setBodyText(
                    `return this.${genericContractId}.createAndSendUpdateTransaction(
    '${entrypointName}',
    SDK.encodeHexString,
    ${transactionMetadataId},
    ${parameterId},
    ${signerId}
);`
                );
            const blockHashId = 'blockHash';
            dryRunClassDecl
                .addMethod({
                    docs: [
                        `Dry run an update-contract transaction to the '${entrypointName}' entrypoint of the '${contract.contractName}' contract.

@param {SDK.HexString} ${parameterId} - Hex encoded parameter for entrypoint
@param {SDK.HexString} [${blockHashId}] - Block hash of the block to invoke entrypoint at

@throws If the entrypoint is not successfully invoked.

returns {SDK.HexString} Hex encoded response`,
                    ],
                    scope: tsm.Scope.Public,
                    name: toCamelCase(entrypointName),
                    parameters: [
                        {
                            name: parameterId,
                            type: 'SDK.HexString',
                        },
                        {
                            name: blockHashId,
                            type: 'SDK.HexString',
                            hasQuestionToken: true,
                        },
                    ],
                    returnType: 'Promise<SDK.HexString>',
                })
                .setBodyText(
                    `return this.${genericContractId}.invokeView(
    '${entrypointName}',
    SDK.encodeHexString,
    (hex: SDK.HexString) => hex,
    ${parameterId},
    ${blockHashId}
);`
                );
        }
    }
}

/** Make the first character in a string uppercase */
function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.substring(1);
}

/**
 * Convert a string in snake_case or kebab-case into camelCase.
 * This is used to transform entrypoint names in the smart contract to follow formatting javascript convention.
 */
function toCamelCase(str: string): string {
    return str
        .split(/[-_]/g)
        .map((word, index) => (index === 0 ? word : capitalize(word)))
        .join('');
}

/**
 * Convert a string in snake_case or kebab-case into PascalCase.
 * This is used to transform contract names in the smart contract to follow formatting javascript convention.
 */
function toPascalCase(str: string): string {
    return str.split(/[-_]/g).map(capitalize).join('');
}
