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
        const contractSchema: SDK.SchemaContractV3 | undefined =
            moduleSchema?.module.contracts.get(contract.contractName);
        const initParameter = constructParameterType(
            parameterId,
            contractSchema?.init?.parameter
        );

        const initParameterTypeId = `${toPascalCase(
            contract.contractName
        )}Parameter`;

        const createInitParameterFnId = `create${toPascalCase(
            contract.contractName
        )}Parameter`;

        if (initParameter !== undefined) {
            moduleSourceFile.addTypeAlias({
                docs: [
                    `Parameter type transaction for instantiating a new '${contract.contractName}' smart contract instance`,
                ],
                isExported: true,
                name: initParameterTypeId,
                type: initParameter.type,
            });

            moduleSourceFile
                .addFunction({
                    docs: [
                        `Construct Parameter type transaction for instantiating a new '${contract.contractName}' smart contract instance.`,
                    ],
                    isExported: true,
                    name: createInitParameterFnId,
                    parameters: [
                        {
                            type: initParameterTypeId,
                            name: parameterId,
                        },
                    ],
                    returnType: 'SDK.Parameter.Type',
                })
                .setBodyText(
                    `${initParameter.tokens.code?.join('\n')}\nreturn ${
                        initParameter.tokens.id
                    }`
                );
        }

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
        : `@param {${initParameterTypeId}} ${parameterId} - Parameter to provide as part of the transaction for the instantiation of a new smart contract contract.`
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
                                  type: initParameterTypeId,
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
    ${
        initParameter === undefined
            ? ''
            : `${createInitParameterFnId}(${parameterId})`
    },
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
@param {SDK.BlockHash.Type} [${blockHashId}] - Hash of the block to check the information at. When not provided the last finalized block is used.

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
                `return ${contractClientId}.${genericContractId}.checkOnChain({moduleReference: ${moduleRefId}, blockHash: ${blockHashId} });`
            );

        const eventParameterId = 'event';
        const eventParameterTypeId = 'Event';
        const eventParser = parseEventType(
            eventParameterId,
            contractSchema?.event
        );
        if (eventParser !== undefined) {
            contractSourceFile.addTypeAlias({
                docs: [
                    `Contract event type for the '${contract.contractName}' contract.`,
                ],
                isExported: true,
                name: eventParameterTypeId,
                type: eventParser.type,
            });

            contractSourceFile
                .addFunction({
                    docs: ['TODO'],
                    isExported: true,
                    name: 'parseEvent',
                    parameters: [
                        {
                            name: eventParameterId,
                            type: 'SDK.ContractEvent.Type',
                        },
                    ],
                    returnType: eventParameterTypeId,
                })
                .setBodyText(
                    `${eventParser.tokens.code.join('\n')}\nreturn <any>${
                        eventParser.tokens.id
                    };`
                );
        }

        const invokerId = 'invoker';
        for (const entrypointName of contract.entrypointNames) {
            const receiveParameter = constructParameterType(
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
                    .setBodyText(
                        `${receiveParameter.tokens.code?.join('\n')}\nreturn ${
                            receiveParameter.tokens.id
                        }`
                    );
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
    SDK.Parameter.toBuffer,
    ${transactionMetadataId},
    ${
        receiveParameter === undefined
            ? ''
            : `${createReceiveParameterFnId}(${parameterId})`
    },
    ${signerId}
);`
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
    SDK.Parameter.toBuffer,
    ${
        receiveParameter === undefined
            ? ''
            : `${createReceiveParameterFnId}(${parameterId})`
    },
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
 * Convert a string in snake_case or kebab-case into PascalCase.
 * This is used to transform contract names in the smart contract to follow formatting javascript convention.
 */
function toPascalCase(str: string): string {
    return str.split(/[-_]/g).map(capitalize).join('');
}

/** Type information from the schema. */
type SchemaNativeType = {
    /** The type to provide for a given schema type. */
    nativeType: string;
    /** Provided the identifier for the input (of the above type), this generates tokens for converting it into Schema JSON format. */
    nativeToJson: (
        nativeId: string,
        idGenerator: (name: string) => string
    ) => { code: string[]; id: string };
    /** Provided the identifier for the input (Schema JSON format), this generates tokens for converting it into a native type (the above type). */
    jsonToNative: (
        jsonId: string,
        idGenerator: (name: string) => string
    ) => { code: string[]; id: string };
};

function schemaAsNativeType(
    schemaType: SDK.SchemaType
): SchemaNativeType | undefined {
    switch (schemaType.type) {
        case 'Unit':
            return undefined;
        case 'Bool':
            return {
                nativeType: 'boolean',
                nativeToJson(id) {
                    return { code: [], id };
                },
                jsonToNative(id) {
                    return { code: [], id };
                },
            };
        case 'U8':
        case 'U16':
        case 'U32':
        case 'I8':
        case 'I16':
        case 'I32':
            return {
                nativeType: 'number',
                nativeToJson(id) {
                    return { code: [], id };
                },
                jsonToNative(id) {
                    return { code: [], id };
                },
            };
        case 'U64':
        case 'I64':
            return {
                nativeType: 'number | bigint',
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('number');
                    return {
                        code: [`const ${resultId} = BigInt(${id});`],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    return { code: [], id };
                },
            };
        case 'U128':
        case 'I128':
            return {
                nativeType: 'number | bigint',
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('number');
                    return {
                        code: [`const ${resultId} = BigInt(${id}).toString();`],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    return { code: [], id: `BigInt(${id})` };
                },
            };
        case 'Amount':
            return {
                nativeType: 'SDK.Amount.Type',
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('amount');
                    return {
                        code: [
                            `const ${resultId} = SDK.Amount.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('amount');
                    return {
                        code: [
                            `const ${resultId} = SDK.Amount.fromSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
            };
        case 'AccountAddress':
            return {
                nativeType: 'SDK.AccountAddress.Type',
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('accountAddress');
                    return {
                        code: [
                            `const ${resultId} = SDK.AccountAddress.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('accountAddress');
                    return {
                        code: [
                            `const ${resultId} = SDK.AccountAddress.fromSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
            };
        case 'ContractAddress':
            return {
                nativeType: 'SDK.ContractAddress.Type',
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('contractAddress');
                    return {
                        code: [
                            `const ${resultId} = SDK.ContractAddress.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('contractAddress');
                    return {
                        code: [
                            `const ${resultId} = SDK.ContractAddress.fromSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
            };
        case 'Timestamp':
            return {
                nativeType: 'SDK.Timestamp.Type',
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('timestamp');
                    return {
                        code: [
                            `const ${resultId} = SDK.Timestamp.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('timestamp');
                    return {
                        code: [
                            `const ${resultId} = SDK.Timestamp.fromSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
            };
        case 'Duration':
            return {
                nativeType: 'SDK.Duration.Type',
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('duration');
                    return {
                        code: [
                            `const ${resultId} = SDK.Duration.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('duration');
                    return {
                        code: [
                            `const ${resultId} = SDK.Duration.fromSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
            };
        case 'Pair':
            const first = schemaAsNativeType(schemaType.first);
            const second = schemaAsNativeType(schemaType.second);

            return {
                nativeType: `[${first?.nativeType}, ${second?.nativeType}]`,
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('pair');
                    const firstTokens = first?.nativeToJson(
                        `${id}[0]`,
                        idGenerator
                    );
                    const secondTokens = second?.nativeToJson(
                        `${id}[1]`,
                        idGenerator
                    );
                    return {
                        code: [
                            ...(firstTokens?.code ?? []),
                            ...(secondTokens?.code ?? []),
                            `const ${resultId} = [${firstTokens?.id}, ${secondTokens?.id}];`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('pair');
                    const firstTokens = first?.jsonToNative(
                        `${id}[0]`,
                        idGenerator
                    );
                    const secondTokens = second?.jsonToNative(
                        `${id}[1]`,
                        idGenerator
                    );
                    return {
                        code: [
                            ...(firstTokens?.code ?? []),
                            ...(secondTokens?.code ?? []),
                            `const ${resultId} = [${firstTokens?.id}, ${secondTokens?.id}];`,
                        ],
                        id: resultId,
                    };
                },
            };
        case 'List': {
            const item = schemaAsNativeType(schemaType.item);
            return {
                nativeType: `Array<${item?.nativeType}>`,
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('list');
                    const itemId = idGenerator('item');
                    const tokens = item?.jsonToNative(itemId, idGenerator);

                    return {
                        code: [
                            `const ${resultId} = ${id}.map((${itemId}: any) => {\n${tokens?.code.join(
                                '\n'
                            )}\nreturn ${tokens?.id}})`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('list');
                    const itemId = idGenerator('item');
                    const tokens = item?.jsonToNative(itemId, idGenerator);
                    return {
                        code: [
                            `const ${resultId} = ${id}.map((${itemId}: any) => {\n${
                                tokens?.code.join('\n') ?? ''
                            }\nreturn ${tokens?.id};\n}));`,
                        ],
                        id: resultId,
                    };
                },
            };
        }
        case 'Set': {
            const item = schemaAsNativeType(schemaType.item);
            return {
                nativeType: `Set<${item?.nativeType}>`,
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('set');
                    const valueId = idGenerator('value');
                    const valuesId = idGenerator('values');
                    const valueTokens = item?.nativeToJson(
                        valueId,
                        idGenerator
                    );
                    return {
                        code: [
                            `const ${valuesId} = [...${id}.values()]..map((${valueId}: any) => {\n${valueTokens?.code.join(
                                '\n'
                            )}\nreturn ${valueTokens?.id}});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('set');
                    const valueId = idGenerator('value');
                    const valuesId = idGenerator('values');
                    const valueTokens = item?.jsonToNative(
                        valueId,
                        idGenerator
                    );
                    return {
                        code: [
                            `const ${valuesId} = ${id}.map((${valueId}: any) => {\n${valueTokens?.code.join(
                                '\n'
                            )}return ${valueTokens?.id}})`,
                            `const ${resultId} = new Set(${valuesId});`,
                        ],
                        id: resultId,
                    };
                },
            };
        }
        case 'Map': {
            const key = schemaAsNativeType(schemaType.key);
            const value = schemaAsNativeType(schemaType.value);
            return {
                nativeType: `Map<${key?.nativeType}, ${value?.nativeType}>`,
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('map');
                    const keyId = idGenerator('key');
                    const valueId = idGenerator('value');
                    const keyTokens = key?.nativeToJson(keyId, idGenerator);
                    const valueTokens = value?.nativeToJson(
                        valueId,
                        idGenerator
                    );

                    return {
                        code: [
                            `const ${resultId} = [...${id}.entries()].map(([${keyId}, ${valueId}]) => {\n${[
                                ...(keyTokens?.code ?? []),
                                ...(valueTokens?.code ?? []),
                            ].join('\n')}\nreturn [${keyTokens?.id}, ${
                                valueTokens?.id
                            }]})`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('map');
                    const entriesId = idGenerator('entries');
                    const keyId = idGenerator('key');
                    const valueId = idGenerator('value');
                    const keyTokens = key?.jsonToNative(keyId, idGenerator);
                    const valueTokens = value?.jsonToNative(
                        valueId,
                        idGenerator
                    );
                    return {
                        code: [
                            `const ${entriesId} = ${id}.map(([${keyId}, ${valueId}]) => {\n${[
                                ...(keyTokens?.code ?? []),
                                ...(valueTokens?.code ?? []),
                            ].join('\n')}\nreturn [${keyTokens?.id}, ${
                                valueTokens?.id
                            }]})`,
                            `const ${resultId} = Map.fromEntries(${entriesId});`,
                        ],
                        id: resultId,
                    };
                },
            };
        }
        case 'Array': {
            const item = schemaAsNativeType(schemaType.item);
            return {
                nativeType: `Array<${item?.nativeType}>`,
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('array');
                    const itemId = idGenerator('item');
                    const tokens = item?.nativeToJson(itemId, idGenerator);
                    return {
                        code: [
                            `const ${resultId} = ${id}.map((${itemId}: any) => {\n${tokens?.code.join(
                                '\n'
                            )}\nreturn ${tokens?.id}; });`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('array');
                    const itemId = idGenerator('item');
                    const tokens = item?.jsonToNative(itemId, idGenerator);
                    return {
                        code: [
                            `const ${resultId} = ${id}.map((${itemId}: any) => {\n${
                                tokens?.code.join('\n') ?? ''
                            }return ${tokens?.id};\n});`,
                        ],
                        id: resultId,
                    };
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

            const variantFieldSchemas = variants.map((variant) => ({
                name: variant.name,
                ...fieldToTypeAndMapper(variant.fields),
            }));

            const variantTypes = variantFieldSchemas.map(
                (variantSchema) =>
                    `{ type: '${variantSchema.name}'${
                        variantSchema.nativeType === undefined
                            ? ''
                            : `, content: ${variantSchema.nativeType}`
                    } }`
            );

            return {
                nativeType: variantTypes.join(' | '),
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('match');

                    const variantCases = variantFieldSchemas.map(
                        (variantSchema) => {
                            const tokens = variantSchema.nativeToJson?.(
                                `${id}.content`,
                                idGenerator
                            );
                            return `    case '${variantSchema.name}': {
        ${tokens?.code.join('\n        ') ?? ''}
        return { '${variantSchema.name}': ${tokens?.id ?? '[]'} };
    }`;
                        }
                    );
                    return {
                        code: [
                            `const ${resultId} = (() => { switch (${id}.type) {\n${variantCases.join(
                                '\n'
                            )}\n}})();`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const variantKeyId = idGenerator('variantKey');

                    const variantCases = variantFieldSchemas.map(
                        (variantFieldSchema) => {
                            const variantId = idGenerator('variant');
                            const variantTokens =
                                variantFieldSchema.jsonToNative?.(
                                    variantId,
                                    idGenerator
                                );
                            return `    case '${variantFieldSchema.name}': {
        ${
            variantTokens === undefined
                ? ''
                : `const ${variantId} = ${id}['${variantFieldSchema.name}'];
        ${variantTokens?.code.join('\n') ?? ''}`
        }
        return {
            type: '${variantFieldSchema.name}',
            content: ${variantTokens?.id ?? '[]'},
        };
    }`;
                        }
                    );
                    const resultId = idGenerator('match');
                    return {
                        code: [
                            `const ${variantKeyId} = Object.keys(${id})[0]`,
                            `const ${resultId} = (() => {
    switch (${variantKeyId}) {\n${variantCases.join('\n')}\n}})();`,
                        ],
                        id: resultId,
                    };
                },
            };
        }
        case 'String':
            return {
                nativeType: 'string',
                nativeToJson(id) {
                    return { code: [], id };
                },
                jsonToNative(id) {
                    return {
                        code: [],
                        id,
                    };
                },
            };
        case 'ContractName':
            return {
                nativeType: 'SDK.ContractName.Type',
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('contractName');
                    return {
                        code: [
                            `const ${resultId} = SDK.ContractName.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('contractName');
                    return {
                        code: [
                            `const ${resultId} = SDK.ContractName.fromSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
            };
        case 'ReceiveName':
            return {
                nativeType: 'SDK.ReceiveName.Type',
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('receiveName');
                    return {
                        code: [
                            `const ${resultId} = SDK.ReceiveName.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const resultId = idGenerator('receiveName');
                    return {
                        code: [
                            `const ${resultId} = SDK.ReceiveName.fromSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
            };
        case 'ULeb128':
        case 'ILeb128':
            return {
                nativeType: 'number | bigint',
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('number');
                    return {
                        code: [`const ${resultId} = BigInt(${id}).toString();`],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    return {
                        code: [],
                        id: `BigInt(${id})`,
                    };
                },
            };
        case 'ByteList':
        case 'ByteArray':
            return {
                nativeType: 'SDK.HexString',
                nativeToJson(id) {
                    return { code: [], id };
                },
                jsonToNative(id) {
                    return {
                        code: [],
                        id,
                    };
                },
            };
    }
}

function fieldToTypeAndMapper(
    fields: SDK.SchemaFields
): SchemaNativeType | undefined {
    switch (fields.type) {
        case 'Named': {
            const schemas = fields.fields.flatMap((named) => {
                const schema = schemaAsNativeType(named.field);
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
                (s) => `    '${s.name}': ${s.nativeType},`
            );

            return {
                nativeType: `{\n${objectFieldTypes.join('\n')}\n}`,
                nativeToJson(id, idGenerator) {
                    const resultId = idGenerator('named');
                    const fields = schemas.map((s) => {
                        const fieldId = idGenerator('field');
                        const field = s.nativeToJson?.(fieldId, idGenerator);
                        return {
                            name: s.name,
                            constructTokens: [
                                `const ${fieldId} = ${id}['${s.name}'];`,
                                ...field.code,
                            ],
                            id: field.id,
                        };
                    });
                    const constructTokens = fields.flatMap(
                        (tokens) => tokens.constructTokens
                    );

                    return {
                        code: [
                            ...constructTokens,
                            `const ${resultId} = {\n${fields
                                .map(
                                    (tokens) =>
                                        `    ['${tokens.name}']: ${tokens.id},`
                                )
                                .join('\n')}\n};`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id, idGenerator) {
                    const fields = schemas.map((s) => {
                        const fieldId = idGenerator('field');
                        const field = s.jsonToNative?.(fieldId, idGenerator);
                        return {
                            name: s.name,
                            constructTokens: [
                                `const ${fieldId} = ${id}['${s.name}'];`,
                                ...field.code,
                            ],
                            id: field.id,
                        };
                    });
                    const constructTokens = fields.flatMap(
                        (tokens) => tokens.constructTokens
                    );
                    const resultId = idGenerator('named');
                    return {
                        code: [
                            ...constructTokens,
                            `const ${resultId} = {\n${fields
                                .map(
                                    (tokens) =>
                                        `    ['${tokens.name}']: ${tokens.id},`
                                )
                                .join('\n')}\n};`,
                        ],
                        id: resultId,
                    };
                },
            };
        }
        case 'Unnamed': {
            const schemas = fields.fields.flatMap((f) => {
                const schema = schemaAsNativeType(f);
                return schema === undefined ? [] : [schema];
            });
            if (schemas.length === 1) {
                const schema = schemas[0];
                return {
                    nativeType: schema.nativeType,
                    nativeToJson(id, idGenerator) {
                        const tokens = schema.nativeToJson(id, idGenerator);
                        return { code: tokens.code, id: `[${tokens.id}]` };
                    },
                    jsonToNative(id, idGenerator) {
                        return schema.nativeToJson(id, idGenerator);
                    },
                };
            } else {
                return {
                    nativeType: `[${schemas
                        .map((s) => s?.nativeType)
                        .join(', ')}]`,
                    nativeToJson(id, idGenerator) {
                        const resultId = idGenerator('unnamed');
                        const mapped = schemas.map((schema, index) =>
                            schema.nativeToJson(`${id}[${index}]`, idGenerator)
                        );
                        const constructFields = mapped.flatMap(
                            (tokens) => tokens.code
                        );
                        const fieldIds = mapped.map((s) => s.id);
                        return {
                            code: [
                                ...constructFields,
                                `const ${resultId} = [${fieldIds.join(', ')}];`,
                            ],
                            id: resultId,
                        };
                    },
                    jsonToNative(id, idGenerator) {
                        const resultId = idGenerator('unnamed');
                        const mapped = schemas.map((schema, index) =>
                            schema.jsonToNative(`${id}[${index}]`, idGenerator)
                        );
                        const constructFields = mapped.flatMap(
                            (tokens) => tokens.code
                        );
                        const fieldIds = mapped.map((s) => s.id);
                        return {
                            code: [
                                ...constructFields,
                                `const ${resultId} = [${fieldIds.join(', ')}];`,
                            ],
                            id: resultId,
                        };
                    },
                };
            }
        }
        case 'None':
            return undefined;
    }
}

function constructParameterType(
    parameterId: string,
    schemaType?: SDK.SchemaType
) {
    // No schema type is present so fallback to plain parameter.
    if (schemaType === undefined) {
        return {
            type: 'SDK.Parameter.Type',
            tokens: { code: [], id: parameterId },
        };
    }

    const typeAndMapper = schemaAsNativeType(schemaType);
    if (typeAndMapper === undefined) {
        // No parameter is needed according to the schema.
        return undefined;
    }

    const buffer = SDK.serializeSchemaType(schemaType);
    const base64Schema = Buffer.from(buffer).toString('base64');

    const mappedParameter = typeAndMapper.nativeToJson(
        parameterId,
        createIdGenerator()
    );
    const resultId = 'out';
    return {
        type: typeAndMapper.nativeType,
        tokens: {
            code: [
                ...mappedParameter.code,
                `const ${resultId} = SDK.Parameter.fromBase64SchemaType('${base64Schema}', ${mappedParameter.id});`,
            ],
            id: resultId,
        },
    };
}

function parseEventType(parameterId: string, schemaType?: SDK.SchemaType) {
    // No schema type is present so generate any code.
    if (schemaType === undefined) {
        return undefined;
    }
    const typeAndMapper = schemaAsNativeType(schemaType);
    if (typeAndMapper === undefined) {
        // No event is emitted according to the schema.
        return undefined;
    }

    const base64Schema = Buffer.from(
        SDK.serializeSchemaType(schemaType)
    ).toString('base64');

    const schemaJsonId = 'schemaJson';
    const tokens = typeAndMapper.jsonToNative(
        schemaJsonId,
        createIdGenerator()
    );
    return {
        type: typeAndMapper.nativeType,
        tokens: {
            code: [
                `const ${schemaJsonId} = (<any>SDK.ContractEvent.parseWithSchemaTypeBase64(${parameterId}, '${base64Schema}'))`,
                ...tokens.code,
            ],
            id: tokens.id,
        },
    };
}

function createIdGenerator() {
    let counter = 0;
    return (name: string) => `${name}${counter++}`;
}
