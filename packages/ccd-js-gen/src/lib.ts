import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as tsm from 'ts-morph';
import * as SDK from '@concordium/node-sdk';

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
    const rawModuleSchema = await SDK.getEmbeddedModuleSchema(moduleSource);
    const moduleSchema =
        rawModuleSchema === null
            ? null
            : SDK.parseRawModuleSchema(rawModuleSchema);

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
        const contractSchema = moduleSchema?.module.contracts.get(
            contract.contractName
        );
        const initParameter = constructType(
            parameterId,
            contractSchema?.init?.parameter
        );

        moduleSourceFile
            .addFunction({
                docs: [
                    `Send transaction for instantiating a new '${
                        contract.contractName
                    }' smart contract instance.

@param {${moduleClientType}} ${moduleClientId} - The client of the on-chain smart contract module with referecence '${
                        moduleRef.moduleRef
                    }'.
@param {SDK.ContractTransactionMetadata} ${transactionMetadataId} - Metadata related to constructing a transaction for a smart contract module.
${
    initParameter === undefined
        ? ''
        : `@param {${initParameter.type}} ${parameterId} - Parameter to provide as part of the transaction for the instantiation of a new smart contract contract.`
}
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
                    ...(initParameter === undefined
                        ? []
                        : [
                              {
                                  name: parameterId,
                                  type: initParameter.type,
                              },
                          ]),
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
    ${initParameter?.tokens ?? 'SDK.Parameter.empty()'},
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
                    type: 'SDK.ContractAddress.Type',
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
                    {
                        name: contractAddressId,
                        type: 'SDK.ContractAddress.Type',
                    },
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
@param {SDK.ContractAddress.Type} ${contractAddressId} - Address of the contract instance.
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
                        type: 'SDK.ContractAddress.Type',
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
                `const ${genericContractId} = new SDK.Contract(${grpcClientId}, ${contractAddressId}, ${contractNameId});
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
@param {SDK.ContractAddress.Type} ${contractAddressId} - Address of the contract instance.

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
                        type: 'SDK.ContractAddress.Type',
                    },
                ],
                returnType: contractClientType,
            })
            .setBodyText(
                `const ${genericContractId} = new SDK.Contract(${grpcClientId}, ${contractAddressId}, ${contractNameId});
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
            const receiveParameter = constructType(
                parameterId,
                contractSchema?.receive.get(entrypointName)?.parameter
            );

            const receiveParameterTypeId = `${toPascalCase(
                entrypointName
            )}Parameter`;

            const createReceiveParameterFnId = `create${toPascalCase(
                entrypointName
            )}Parameter`;

            if (receiveParameter !== undefined) {
                contractSourceFile.addTypeAlias({
                    docs: [
                        `Parameter type for update transaction for '${entrypointName}' entrypoint of the '${contract.contractName}' contract.`,
                    ],
                    isExported: true,
                    name: receiveParameterTypeId,
                    type: receiveParameter.type,
                });

                contractSourceFile
                    .addFunction({
                        docs: [
                            `Construct Parameter for update transactions for '${entrypointName}' entrypoint of the '${contract.contractName}' contract.`,
                        ],
                        isExported: true,
                        name: createReceiveParameterFnId,
                        parameters: [
                            {
                                type: receiveParameterTypeId,
                                name: parameterId,
                            },
                        ],
                        returnType: 'SDK.Parameter.Type',
                    })
                    .setBodyText(`return ${receiveParameter.tokens}`);
            }

            contractSourceFile
                .addFunction({
                    docs: [
                        `Send an update-contract transaction to the '${entrypointName}' entrypoint of the '${
                            contract.contractName
                        }' contract.

@param {${contractClientType}} ${contractClientId} The client for a '${
                            contract.contractName
                        }' smart contract instance on chain.
@param {SDK.ContractTransactionMetadata} ${transactionMetadataId} - Metadata related to constructing a transaction for a smart contract.
${
    receiveParameter === undefined
        ? ''
        : `@param {${receiveParameterTypeId}} ${parameterId} - Parameter to provide the smart contract entrypoint as part of the transaction.`
}
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
                        ...(receiveParameter === undefined
                            ? []
                            : [
                                  {
                                      name: parameterId,
                                      type: receiveParameterTypeId,
                                  },
                              ]),
                        {
                            name: signerId,
                            type: 'SDK.AccountSigner',
                        },
                    ],
                    returnType: 'Promise<SDK.TransactionHash.Type>',
                })
                .setBodyText(
                    `return ${contractClientId}.${genericContractId}.createAndSendUpdateTransaction(
    SDK.EntrypointName.fromStringUnchecked('${entrypointName}'),
    SDK.encodeHexString,
    ${transactionMetadataId},
    ${
        receiveParameter === undefined
            ? ''
            : `SDK.Parameter.toHexString(${createReceiveParameterFnId}(${parameterId}))`
    },
    ${signerId}
).then(SDK.TransactionHash.fromHexString);`
                );

            contractSourceFile
                .addFunction({
                    docs: [
                        `Dry-run an update-contract transaction to the '${entrypointName}' entrypoint of the '${
                            contract.contractName
                        }' contract.

@param {${contractClientType}} ${contractClientId} The client for a '${
                            contract.contractName
                        }' smart contract instance on chain.
@param {SDK.ContractAddress.Type | SDK.AccountAddress.Type} ${invokerId} - The address of the account or contract which is invoking this transaction.
${
    receiveParameter === undefined
        ? ''
        : `@param {${receiveParameterTypeId}} ${parameterId} - Parameter to provide the smart contract entrypoint as part of the transaction.`
}@param {SDK.BlockHash.Type} [${blockHashId}] - Optional block hash allowing for dry-running the transaction at the end of a specific block.

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
                            type: 'SDK.ContractAddress.Type | SDK.AccountAddress.Type',
                        },
                        ...(receiveParameter === undefined
                            ? []
                            : [
                                  {
                                      name: parameterId,
                                      type: receiveParameterTypeId,
                                  },
                              ]),
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
    SDK.EntrypointName.fromStringUnchecked('${entrypointName}'),
    ${invokerId},
    SDK.encodeHexString,
    ${
        receiveParameter === undefined
            ? ''
            : `SDK.Parameter.toHexString(${createReceiveParameterFnId}(${parameterId}))`
    },
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

/** Type information from the schema. */
type SchemaTypeAndMapper = {
    /** The type to provide for a given schema type. */
    type: string;
    /** Provided the identifier for the input (of the above type), this generates tokens for converting it into Schema JSON format. */
    mapper: (id: string) => string;
};

function schemaToTypeAndMapper(
    schemaType: SDK.SchemaType
): SchemaTypeAndMapper | undefined {
    switch (schemaType.type) {
        case 'Unit':
            return undefined;
        case 'Bool':
            return {
                type: 'boolean',
                mapper(id) {
                    return id;
                },
            };
        case 'U8':
        case 'U16':
        case 'U32':
        case 'I8':
        case 'I16':
        case 'I32':
            return {
                type: 'number',
                mapper(id) {
                    return id;
                },
            };
        case 'U64':
        case 'I64':
        case 'U128':
        case 'I128':
            return {
                type: 'number | bigint',
                mapper(id) {
                    return `BigInt(${id}).toString()`; // TODO: check that the schema JSON actually use a string here.
                },
            };
        case 'Amount':
            return {
                type: 'SDK.Amount.Type',
                mapper(id) {
                    return `SDK.Amount.toSchemaValue(${id})`;
                },
            };
        case 'AccountAddress':
            return {
                type: 'SDK.AccountAddress.Type',
                mapper(id) {
                    return `SDK.AccountAddress.toSchemaValue(${id})`;
                },
            };
        case 'ContractAddress':
            return {
                type: 'SDK.ContractAddress.Type',
                mapper(id) {
                    return `SDK.ContractAddress.toSchemaValue(${id})`;
                },
            };
        case 'Timestamp':
            return {
                type: 'SDK.Timestamp.Type',
                mapper(id) {
                    return `SDK.Timestamp.toSchemaValue(${id})`;
                },
            };
        case 'Duration':
            return {
                type: 'SDK.Duration.Type',
                mapper(id) {
                    return `SDK.Duration.toSchemaValue(${id})`;
                },
            };
        case 'Pair':
            const first = schemaToTypeAndMapper(schemaType.first);
            const second = schemaToTypeAndMapper(schemaType.second);

            return {
                type: `[${first?.type}, ${second?.type}]`,
                mapper(id) {
                    return `[${first?.mapper(`${id}[0]`)}, ${second?.mapper(
                        `${id}[1]`
                    )}]`;
                },
            };
        case 'List': {
            const item = schemaToTypeAndMapper(schemaType.item);
            return {
                type: `Array<${item?.type}>`,
                mapper(id) {
                    return `${id}.map((item) => (${item?.mapper('item')}))`;
                },
            };
        }
        case 'Set': {
            const item = schemaToTypeAndMapper(schemaType.item);
            return {
                type: `Set<${item?.type}>`,
                mapper(id) {
                    return `[...${id}.values()].map((value) => (${item?.mapper(
                        'value'
                    )}))`;
                },
            };
        }
        case 'Map': {
            const key = schemaToTypeAndMapper(schemaType.key);
            const value = schemaToTypeAndMapper(schemaType.value);
            return {
                type: `Map<${key?.type}, ${value?.type}>`,
                mapper(id) {
                    return `[...${id}.entries()].map(([key, value]) => [${key?.mapper(
                        'key'
                    )}, ${value?.mapper('value')}])`;
                },
            };
        }
        case 'Array': {
            const item = schemaToTypeAndMapper(schemaType.item);
            return {
                type: `Array<${item?.type}>`,
                mapper(id) {
                    return `${id}.map((item) => (${item?.mapper('item')}))`;
                },
            };
        }
        case 'Struct':
            return fieldToTypeAndMapper(schemaType.fields);

        case 'Enum':
        case 'TaggedEnum': {
            const variants =
                schemaType.type === 'Enum'
                    ? schemaType.variants
                    : [...schemaType.variants.values()];

            const variantSchemas = variants.map((variant) => ({
                name: variant.name,
                ...fieldToTypeAndMapper(variant.fields),
            }));

            const variantTypes = variantSchemas.map(
                (variantSchema) =>
                    `{ type: '${variantSchema.name}'${
                        variantSchema.type === undefined
                            ? ''
                            : `, content: ${variantSchema.type}`
                    } }`
            );

            return {
                type: variantTypes.join(' | '),
                mapper(id) {
                    const variantCases = variantSchemas.map(
                        (variantSchema) => `    case '${variantSchema.name}': {
        return { '${variantSchema.name}': ${
                            variantSchema.mapper?.(`${id}.content`) ?? '[]'
                        }};
    }`
                    );
                    return `(() => { switch (${id}.type) {\n${variantCases.join(
                        '\n'
                    )}\n}})()`;
                },
            };
        }
        case 'String':
            return {
                type: 'string',
                mapper(id) {
                    return id;
                },
            };
        case 'ContractName':
            return {
                type: 'SDK.ContractName.Type',
                mapper(id) {
                    return `SDK.ContractName.toSchemaValue(${id})`;
                },
            };
        case 'ReceiveName':
            return {
                type: 'SDK.ReceiveName.Type',
                mapper(id) {
                    return `SDK.ReceiveName.toSchemaValue(${id})`;
                },
            };
        case 'ULeb128':
        case 'ILeb128':
            return {
                type: 'number | bigint',
                mapper(id) {
                    return `BigInt(${id}).toString()`;
                },
            };
        case 'ByteList':
        case 'ByteArray':
            return {
                type: 'SDK.HexString',
                mapper(id) {
                    return id;
                },
            };
    }
}

function fieldToTypeAndMapper(
    fields: SDK.SchemaFields
): SchemaTypeAndMapper | undefined {
    switch (fields.type) {
        case 'Named': {
            const schemas = fields.fields.flatMap((named) => {
                const schema = schemaToTypeAndMapper(named.field);
                return schema === undefined
                    ? []
                    : [
                          {
                              name: named.name,
                              ...schema,
                          },
                      ];
            });

            const objectFieldTypes = schemas.flatMap(
                (s) => `    '${s.name}': ${s.type},`
            );

            return {
                type: `{\n${objectFieldTypes.join('\n')}\n}`,
                mapper(id) {
                    const objectFields = schemas.map(
                        (s) =>
                            `   '${s.name}': ${s.mapper?.(
                                `${id}['${s.name}']`
                            )},`
                    );
                    return `{\n${objectFields.join('\n')}\n}`;
                },
            };
        }
        case 'Unnamed': {
            const schemas = fields.fields.flatMap((f) => {
                const schema = schemaToTypeAndMapper(f);
                return schema === undefined ? [] : [schema];
            });
            if (schemas.length === 1) {
                const schema = schemas[0];
                return {
                    type: schema.type,
                    mapper(id) {
                        return `[${schema.mapper(id)}]`;
                    },
                };
            } else {
                return {
                    type: `[${schemas.map((s) => s?.type).join(', ')}]`,
                    mapper(id) {
                        const mapped = schemas.map((schema, index) =>
                            schema.mapper(`${id}[${index}]`)
                        );
                        return `[${mapped.join(', ')}]`;
                    },
                };
            }
        }
        case 'None':
            return undefined;
    }
}

function constructType(parameterId: string, schemaType?: SDK.SchemaType) {
    // No schema type is present so fallback to plain parameter.
    if (schemaType === undefined) {
        return { type: 'SDK.Parameter.Type', tokens: parameterId };
    }

    const typeAndMapper = schemaToTypeAndMapper(schemaType);
    if (typeAndMapper === undefined) {
        // No parameter is needed according to the schema.
        return undefined;
    }

    const base64Schema = Buffer.from(
        SDK.serializeSchemaType(schemaType)
    ).toString('base64');

    const mappedParameter =
        typeAndMapper.mapper === undefined
            ? parameterId
            : typeAndMapper.mapper(parameterId);
    return {
        type: typeAndMapper.type,
        tokens: `SDK.Parameter.fromBase64SchemaType('${base64Schema}', ${mappedParameter})`,
    };
}
