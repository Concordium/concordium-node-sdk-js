import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as tsm from 'ts-morph';
import * as SDK from '@concordium/common-sdk';

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
    const moduleSource = SDK.versionedModuleSourceFromBuffer(fileBytes);
    return generateContractClients(
        moduleSource,
        outputName,
        outDirPath,
        options
    );
}

/**
 * Generate smart contract client code for a given smart contract module.
 * @param moduleSource Buffer with bytes for the smart contract module.
 * @param outName Name for the output file.
 * @param outDirPath Path to the directory to use for the output.
 * @param options Options for generating the clients.
 * @throws If unable to write to provided directory `outDirPath`.
 */
export async function generateContractClients(
    moduleSource: SDK.VersionedModuleSource,
    outName: string,
    outDirPath: string,
    options: GenerateContractClientsOptions = {}
): Promise<void> {
    const outputOption = options.output ?? 'Everything';

    const compilerOptions: tsm.CompilerOptions = {
        outDir: outDirPath,
        declaration:
            outputOption === 'Everything' || outputOption === 'TypedJavaScript',
    };
    const project = new tsm.Project({ compilerOptions });

    await addModuleClient(project, outName, outDirPath, moduleSource);

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

/** Iterates a module interface building source files in the project. */
async function addModuleClient(
    project: tsm.Project,
    outModuleName: string,
    outDirPath: string,
    moduleSource: SDK.VersionedModuleSource
) {
    const moduleInterface = await SDK.parseModuleInterface(moduleSource);
    const moduleRef = await SDK.calculateModuleReference(moduleSource);

    const outputFilePath = path.format({
        dir: outDirPath,
        name: outModuleName,
        ext: '.ts',
    });
    const moduleSourceFile = project.createSourceFile(outputFilePath, '', {
        overwrite: true,
    });
    moduleSourceFile.addImportDeclaration({
        namespaceImport: 'SDK',
        moduleSpecifier: '@concordium/common-sdk',
    });
    const moduleRefId = 'moduleReference';

    moduleSourceFile.addVariableStatement({
        isExported: true,
        declarationKind: tsm.VariableDeclarationKind.Const,
        docs: [
            'The reference of the smart contract module supported by the provided client.',
        ],
        declarations: [
            {
                name: moduleRefId,
                type: 'SDK.ModuleReference',
                initializer: `new SDK.ModuleReference('${moduleRef.moduleRef}')`,
            },
        ],
    });

    const moduleClientType = `${toPascalCase(outModuleName)}Module`;
    const internalModuleClientId = 'internalModuleClient';

    const moduleClassDecl = moduleSourceFile.addClass({
        docs: [
            `Client for an on-chain smart contract module with module reference '${moduleRef.moduleRef}', can be used for instantiating new smart contract instances.`,
        ],
        name: moduleClientType,
        properties: [
            {
                docs: [
                    'Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing).',
                ],
                scope: tsm.Scope.Private,
                name: '__nominal',
                initializer: 'true',
            },
            {
                docs: ['Generic module client used internally.'],
                scope: tsm.Scope.Public,
                isReadonly: true,
                name: internalModuleClientId,
                type: 'SDK.ModuleClient.Type',
            },
        ],
    });

    moduleClassDecl
        .addConstructor({
            docs: [
                'Constructor is only ment to be used internally in this module. Use functions such as `create` or `createUnchecked` for construction.',
            ],
            parameters: [
                {
                    name: internalModuleClientId,
                    type: 'SDK.ModuleClient.Type',
                },
            ],
        })
        .setBodyText(
            `this.${internalModuleClientId} = ${internalModuleClientId};`
        );

    moduleSourceFile.addTypeAlias({
        docs: [
            `Client for an on-chain smart contract module with module reference '${moduleRef.moduleRef}', can be used for instantiating new smart contract instances.`,
        ],
        name: 'Type',
        isExported: true,
        type: moduleClientType,
    });

    const grpcClientId = 'grpcClient';
    moduleSourceFile
        .addFunction({
            docs: [
                `Construct a ${moduleClientType} client for interacting with a smart contract module on chain.
This function ensures the smart contract module is deployed on chain.

@param {SDK.ConcordiumGRPCClient} ${grpcClientId} - The concordium node client to use.

@throws If failing to communicate with the concordium node or if the module reference is not present on chain.

@returns {${moduleClientType}} A module client ensured to be deployed on chain.`,
            ],
            isExported: true,
            isAsync: true,
            name: 'create',
            parameters: [
                {
                    name: grpcClientId,
                    type: 'SDK.ConcordiumGRPCClient',
                },
            ],
            returnType: `Promise<${moduleClientType}>`,
        })
        .setBodyText(
            `const moduleClient = await SDK.ModuleClient.create(${grpcClientId}, ${moduleRefId});
return new ${moduleClientType}(moduleClient);`
        );
    moduleSourceFile
        .addFunction({
            docs: [
                `Construct a ${moduleClientType} client for interacting with a smart contract module on chain.
It is up to the caller to ensure the module is deployed on chain.

@param {SDK.ConcordiumGRPCClient} ${grpcClientId} - The concordium node client to use.

@throws If failing to communicate with the concordium node.

@returns {${moduleClientType}}`,
            ],
            isExported: true,
            name: 'createUnchecked',
            parameters: [
                {
                    name: grpcClientId,
                    type: 'SDK.ConcordiumGRPCClient',
                },
            ],
            returnType: `${moduleClientType}`,
        })
        .setBodyText(
            `const moduleClient = SDK.ModuleClient.createUnchecked(${grpcClientId}, ${moduleRefId});
return new ${moduleClientType}(moduleClient);`
        );

    const moduleClientId = 'moduleClient';

    moduleSourceFile
        .addFunction({
            docs: [
                `Construct a ${moduleClientType} client for interacting with a smart contract module on chain.
This function ensures the smart contract module is deployed on chain.

@param {${moduleClientType}} ${moduleClientId} - The client of the on-chain smart contract module with referecence '${moduleRef.moduleRef}'.
@throws If failing to communicate with the concordium node or if the module reference is not present on chain.

@returns {${moduleClientType}} A module client ensured to be deployed on chain.`,
            ],
            isExported: true,
            name: 'checkOnChain',
            parameters: [
                {
                    name: moduleClientId,
                    type: moduleClientType,
                },
            ],
            returnType: 'Promise<void>',
        })
        .setBodyText(
            `return SDK.ModuleClient.checkOnChain(${moduleClientId}.${internalModuleClientId});`
        );

    moduleSourceFile
        .addFunction({
            docs: [
                `Get the module source of the deployed smart contract module.

@param {${moduleClientType}} ${moduleClientId} - The client of the on-chain smart contract module with referecence '${moduleRef.moduleRef}'.
@throws {SDK.RpcError} If failing to communicate with the concordium node or module not found.
@returns {SDK.VersionedModuleSource} Module source of the deployed smart contract module.`,
            ],
            isExported: true,
            name: 'getModuleSource',
            parameters: [
                {
                    name: moduleClientId,
                    type: moduleClientType,
                },
            ],
            returnType: 'Promise<SDK.VersionedModuleSource>',
        })
        .setBodyText(
            `return SDK.ModuleClient.getModuleSource(${moduleClientId}.${internalModuleClientId});`
        );

    const transactionMetadataId = 'transactionMetadata';
    const parameterId = 'parameter';
    const signerId = 'signer';

    for (const contract of moduleInterface.values()) {
        moduleSourceFile
            .addFunction({
                docs: [
                    `Send transaction for instantiating a new '${contract.contractName}' smart contract instance.

@param {${moduleClientType}} ${moduleClientId} - The client of the on-chain smart contract module with referecence '${moduleRef.moduleRef}'.
@param {SDK.ContractTransactionMetadata} ${transactionMetadataId} - Metadata related to constructing a transaction for a smart contract module.
@param {SDK.Parameter.Type} ${parameterId} - Parameter to provide as part of the transaction for the instantiation of a new smart contract contract.
@param {SDK.AccountSigner} ${signerId} - The signer of the update contract transaction.

@throws If failing to communicate with the concordium node.

@returns {SDK.TransactionHash.Type}`,
                ],
                isExported: true,
                name: `instantiate${toPascalCase(contract.contractName)}`,
                parameters: [
                    {
                        name: moduleClientId,
                        type: moduleClientType,
                    },
                    {
                        name: transactionMetadataId,
                        type: 'SDK.ContractTransactionMetadata',
                    },
                    {
                        name: parameterId,
                        type: 'SDK.Parameter.Type',
                    },
                    {
                        name: signerId,
                        type: 'SDK.AccountSigner',
                    },
                ],
                returnType: 'Promise<SDK.TransactionHash.Type>',
            })
            .setBodyText(
                `return SDK.ModuleClient.createAndSendInitTransaction(
    ${moduleClientId}.${internalModuleClientId},
    SDK.ContractName.fromStringUnchecked('${contract.contractName}'),
    ${transactionMetadataId},
    ${parameterId},
    ${signerId}
);`
            );

        const contractOutputFilePath = path.format({
            dir: outDirPath,
            name: contract.contractName,
            ext: '.ts',
        });
        const contractSourceFile = project.createSourceFile(
            contractOutputFilePath,
            '',
            {
                overwrite: true,
            }
        );

        const moduleRefId = 'moduleReference';
        const grpcClientId = 'grpcClient';
        const contractNameId = 'contractName';
        const genericContractId = 'genericContract';
        const contractAddressId = 'contractAddress';
        const blockHashId = 'blockHash';
        const contractClientType = `${toPascalCase(
            contract.contractName
        )}Contract`;

        contractSourceFile.addImportDeclaration({
            namespaceImport: 'SDK',
            moduleSpecifier: '@concordium/common-sdk',
        });

        contractSourceFile.addVariableStatement({
            docs: [
                'The reference of the smart contract module supported by the provided client.',
            ],
            isExported: true,
            declarationKind: tsm.VariableDeclarationKind.Const,
            declarations: [
                {
                    name: moduleRefId,
                    type: 'SDK.ModuleReference',
                    initializer: `new SDK.ModuleReference('${moduleRef.moduleRef}')`,
                },
            ],
        });

        contractSourceFile.addVariableStatement({
            docs: ['Name of the smart contract supported by this client.'],
            isExported: true,
            declarationKind: tsm.VariableDeclarationKind.Const,
            declarations: [
                {
                    name: contractNameId,
                    type: 'SDK.ContractName.Type',
                    initializer: `SDK.ContractName.fromStringUnchecked('${contract.contractName}')`,
                },
            ],
        });

        const contractClassDecl = contractSourceFile.addClass({
            docs: ['Smart contract client for a contract instance on chain.'],
            name: contractClientType,
            properties: [
                {
                    docs: [
                        'Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing).',
                    ],
                    scope: tsm.Scope.Private,
                    name: '__nominal',
                    initializer: 'true',
                },
                {
                    docs: ['The gRPC connection used by this client.'],
                    scope: tsm.Scope.Public,
                    isReadonly: true,
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
                    docs: ['Generic contract client used internally.'],
                    scope: tsm.Scope.Public,
                    isReadonly: true,
                    name: genericContractId,
                    type: 'SDK.Contract',
                },
            ],
        });

        contractClassDecl
            .addConstructor({
                parameters: [
                    { name: grpcClientId, type: 'SDK.ConcordiumGRPCClient' },
                    { name: contractAddressId, type: 'SDK.ContractAddress' },
                    { name: genericContractId, type: 'SDK.Contract' },
                ],
            })
            .setBodyText(
                [grpcClientId, contractAddressId, genericContractId]
                    .map((name) => `this.${name} = ${name};`)
                    .join('\n')
            );

        contractSourceFile.addTypeAlias({
            docs: ['Smart contract client for a contract instance on chain.'],
            name: 'Type',
            isExported: true,
            type: contractClientType,
        });

        contractSourceFile
            .addFunction({
                docs: [
                    `Construct an instance of \`${contractClientType}\` for interacting with a '${contract.contractName}' contract on chain.
Checking the information instance on chain.

@param {SDK.ConcordiumGRPCClient} ${grpcClientId} - The client used for contract invocations and updates.
@param {SDK.ContractAddress} ${contractAddressId} - Address of the contract instance.
@param {string} [${blockHashId}] - Hash of the block to check the information at. When not provided the last finalized block is used.

@throws If failing to communicate with the concordium node or if any of the checks fails.

@returns {${contractClientType}}`,
                ],
                isExported: true,
                isAsync: true,
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
                    {
                        name: blockHashId,
                        hasQuestionToken: true,
                        type: 'SDK.BlockHash.Type',
                    },
                ],
                returnType: `Promise<${contractClientType}>`,
            })
            .setBodyText(
                `const ${genericContractId} = new SDK.Contract(${grpcClientId}, ${contractAddressId}, SDK.ContractName.toString(${contractNameId}));
await ${genericContractId}.checkOnChain({ moduleReference: ${moduleRefId}, blockHash: ${blockHashId} });
return new ${contractClientType}(
    ${grpcClientId},
    ${contractAddressId},
    ${genericContractId}
);`
            );

        contractSourceFile
            .addFunction({
                docs: [
                    `Construct the \`${contractClientType}\` for interacting with a '${contract.contractName}' contract on chain.
Without checking the instance information on chain.

@param {SDK.ConcordiumGRPCClient} ${grpcClientId} - The client used for contract invocations and updates.
@param {SDK.ContractAddress} ${contractAddressId} - Address of the contract instance.

@returns {${contractClientType}}`,
                ],
                isExported: true,
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
                returnType: contractClientType,
            })
            .setBodyText(
                `const ${genericContractId} = new SDK.Contract(${grpcClientId}, ${contractAddressId}, SDK.ContractName.toString(${contractNameId}));
    return new ${contractClientType}(
        ${grpcClientId},
        ${contractAddressId},
        ${genericContractId},
    );`
            );

        const contractClientId = 'contractClient';
        contractSourceFile
            .addFunction({
                docs: [
                    `Check if the smart contract instance exists on the blockchain and whether it uses a matching contract name and module reference.

@param {${contractClientType}} ${contractClientId} The client for a '${contract.contractName}' smart contract instance on chain.
@param {SDK.BlockHash.Type} [${blockHashId}] A optional block hash to use for checking information on chain, if not provided the last finalized will be used.

@throws {SDK.RpcError} If failing to communicate with the concordium node or if any of the checks fails.`,
                ],
                isExported: true,
                name: 'checkOnChain',
                parameters: [
                    {
                        name: contractClientId,
                        type: contractClientType,
                    },
                    {
                        name: blockHashId,
                        hasQuestionToken: true,
                        type: 'SDK.BlockHash.Type',
                    },
                ],
                returnType: 'Promise<void>',
            })
            .setBodyText(
                `return ${contractClientId}.${genericContractId}.checkOnChain({moduleReference: ${moduleRefId}, blockHash: ${blockHashId} })`
            );

        const invokerId = 'invoker';

        for (const entrypointName of contract.entrypointNames) {
            contractSourceFile
                .addFunction({
                    docs: [
                        `Send an update-contract transaction to the '${entrypointName}' entrypoint of the '${contract.contractName}' contract.

@param {${contractClientType}} ${contractClientId} The client for a '${contract.contractName}' smart contract instance on chain.
@param {SDK.ContractTransactionMetadata} ${transactionMetadataId} - Metadata related to constructing a transaction for a smart contract.
@param {SDK.Parameter.Type} ${parameterId} - Parameter to provide the smart contract entrypoint as part of the transaction.
@param {SDK.AccountSigner} ${signerId} - The signer of the update contract transaction.

@throws If the entrypoint is not successfully invoked.

@returns {SDK.TransactionHash.Type} Transaction hash`,
                    ],
                    isExported: true,
                    name: `send${toPascalCase(entrypointName)}`,
                    parameters: [
                        {
                            name: contractClientId,
                            type: contractClientType,
                        },
                        {
                            name: transactionMetadataId,
                            type: 'SDK.ContractTransactionMetadata',
                        },
                        {
                            name: parameterId,
                            type: 'SDK.Parameter.Type',
                        },
                        {
                            name: signerId,
                            type: 'SDK.AccountSigner',
                        },
                    ],
                    returnType: 'Promise<SDK.TransactionHash.Type>',
                })
                .setBodyText(
                    `return ${contractClientId}.${genericContractId}.createAndSendUpdateTransaction(
    '${entrypointName}',
    SDK.encodeHexString,
    ${transactionMetadataId},
    SDK.Parameter.toHexString(${parameterId}),
    ${signerId}
).then(SDK.TransactionHash.fromHexString);`
                );

            contractSourceFile
                .addFunction({
                    docs: [
                        `Dry-run an update-contract transaction to the '${entrypointName}' entrypoint of the '${contract.contractName}' contract.

@param {${contractClientType}} ${contractClientId} The client for a '${contract.contractName}' smart contract instance on chain.
@param {SDK.ContractAddress | SDK.AccountAddress} ${invokerId} - The address of the account or contract which is invoking this transaction.
@param {SDK.Parameter.Type} ${parameterId} - Parameter to include in the transaction for the smart contract entrypoint.
@param {SDK.BlockHash.Type} [${blockHashId}] - Optional block hash allowing for dry-running the transaction at the end of a specific block.

@throws {SDK.RpcError} If failing to communicate with the concordium node or if any of the checks fails.

@returns {SDK.InvokeContractResult} The result of invoking the smart contract instance.`,
                    ],
                    isExported: true,
                    name: `dryRun${toPascalCase(entrypointName)}`,
                    parameters: [
                        {
                            name: contractClientId,
                            type: contractClientType,
                        },
                        {
                            name: invokerId,
                            type: 'SDK.ContractAddress | SDK.AccountAddress',
                        },
                        {
                            name: parameterId,
                            type: 'SDK.Parameter.Type',
                        },
                        {
                            name: blockHashId,
                            hasQuestionToken: true,
                            type: 'SDK.BlockHash.Type',
                        },
                    ],
                    returnType: 'Promise<SDK.InvokeContractResult>',
                })
                .setBodyText(
                    `return ${contractClientId}.${genericContractId}.dryRun.invokeMethod(
    '${entrypointName}',
    ${invokerId},
    SDK.encodeHexString,
    SDK.Parameter.toHexString(${parameterId}),
    ${blockHashId} === undefined ? undefined : SDK.BlockHash.toHexString(${blockHashId})
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
 * Convert a string in snake_case or kebab-case into PascalCase.
 * This is used to transform contract names in the smart contract to follow formatting javascript convention.
 */
function toPascalCase(str: string): string {
    return str.split(/[-_]/g).map(capitalize).join('');
}
