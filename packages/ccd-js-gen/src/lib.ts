import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as tsm from 'ts-morph';
import * as SDK from '@concordium/web-sdk';
import sanitize from 'sanitize-filename';

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

/** Options for generating clients. */
export type GenerateContractClientsOptions = {
    /** Options for the output. */
    output?: OutputOptions;
    /** Generate `// @ts-nocheck` annotations in each file. Defaults to `false`. */
    tsNocheck?: boolean;
    /** Callback for getting notified on progress. */
    onProgress?: NotifyProgress;
};

/** Callback for getting notified on progress. */
export type NotifyProgress = (progress: Progress) => void;

/**
 * Progress notification
 */
export type Progress = {
    type: 'Progress';
    /** Total number of 'items' to be generated. */
    totalItems: number;
    /** Number of 'items' generated at the time of this notification. */
    doneItems: number;
    /** Number of milliseconds spent on the previous item. */
    spentTime: number;
    /** Description of the item being completed. */
    description: string;
};

/**
 * Generate smart contract client code for a given smart contract module file.
 * @param {string} modulePath Path to the smart contract module.
 * @param {string} outDirPath Path to the directory to use for the output.
 * @param {GenerateContractClientsOptions} [options] Options for generating the clients.
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
 * @param {SDK.VersionedModuleSource} moduleSource Buffer with bytes for the smart contract module.
 * @param {string} outName Name for the output file.
 * @param {string} outDirPath Path to the directory to use for the output.
 * @param {GenerateContractClientsOptions} [options] Options for generating the clients.
 * @throws If unable to write to provided directory `outDirPath`.
 */
export async function generateContractClients(
    moduleSource: SDK.VersionedModuleSource,
    outName: string,
    outDirPath: string,
    options: GenerateContractClientsOptions = {}
): Promise<void> {
    const notifier = new Notifier(options.onProgress);
    const outputOption = options.output ?? 'Everything';
    const outputTypeScript =
        outputOption === 'Everything' || outputOption === 'TypeScript';
    const outputJavaScript =
        outputOption === 'Everything' ||
        outputOption === 'JavaScript' ||
        outputOption === 'TypedJavaScript';
    const outputDeclarations =
        outputOption === 'Everything' || outputOption === 'TypedJavaScript';

    if (outputTypeScript) {
        notifier.todo(1);
    }
    if (outputJavaScript) {
        notifier.todo(1);
    }

    const compilerOptions: tsm.CompilerOptions = {
        outDir: outDirPath,
        declaration: outputDeclarations,
    };
    const project = new tsm.Project({ compilerOptions });

    await generateCode(
        project,
        outName,
        outDirPath,
        moduleSource,
        options.tsNocheck ?? false,
        notifier
    );

    if (outputTypeScript) {
        await project.save();
        notifier.done('Saving generated TypeScript files.');
    }
    if (outputJavaScript) {
        await project.emit();
        notifier.done('Emitting JavaScript files.');
    }
}

/** Wrapper around the NotifyProgress callback for tracking and reporting progress state. */
class Notifier {
    constructor(private notifyProgress?: NotifyProgress) {}
    /** Total number of items to do. */
    private totalItems = 0;
    /** Total number of items done so far. */
    private doneItems = 0;
    /** Timestamp for last reporting or creation,
     * this is used to measure the time spent between reporting items done. */
    private startTime = Date.now();
    /**
     * Increment the total number of items to do.
     * @param {number} todoItems The amount to increment it with.
     */
    todo(todoItems: number) {
        this.totalItems += todoItems;
    }
    /**
     * Mark an item as done, note the time and report progress.
     * This restarts the timer for the next task.
     * @param {string} description A description of the item which is done.
     */
    done(description: string) {
        const now = Date.now();
        this.doneItems += 1;
        this.notifyProgress?.({
            type: 'Progress',
            totalItems: this.totalItems,
            doneItems: this.doneItems,
            spentTime: now - this.startTime,
            description,
        });
        this.startTime = now;
    }
}

/**
 * Iterates a module interface building source files in the project.
 * @param {tsm.Project} project The project to use for creating sourcefiles.
 * @param {string} outModuleName The name for outputting the module client file.
 * @param {string} outDirPath The directory to use for outputting files.
 * @param {SDK.VersionedModuleSource} moduleSource The source of the smart contract module.
 * @param {boolean} tsNocheck When `true` generate `// @ts-nocheck` annotations in each file.
 * @param {Notifier} notifier Callback to report progress.
 */
async function generateCode(
    project: tsm.Project,
    outModuleName: string,
    outDirPath: string,
    moduleSource: SDK.VersionedModuleSource,
    tsNocheck: boolean,
    notifier: Notifier
) {
    const [moduleInterface, moduleRef, rawModuleSchema] = await Promise.all([
        SDK.parseModuleInterface(moduleSource),
        SDK.calculateModuleReference(moduleSource),
        SDK.getEmbeddedModuleSchema(moduleSource),
    ]);

    notifier.todo(2); // Parsing and adding base statements to module.
    for (const contracts of moduleInterface.values()) {
        // Add initialize function to module and base statements to contract source files.
        notifier.todo(2);
        // Adding entrypoint functions to contract.
        notifier.todo(contracts.entrypointNames.size);
    }
    notifier.done('Parse smart contract module.');

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
    const moduleClientId = 'moduleClient';
    const sanitizedOutModuleName = sanitizeIdentifier(outModuleName);
    const moduleClientType = `${toPascalCase(sanitizedOutModuleName)}Module`;
    const internalModuleClientId = 'internalModuleClient';

    moduleSourceFile.addStatements(
        generateModuleBaseStatements(
            moduleRef,
            moduleClientId,
            moduleClientType,
            internalModuleClientId,
            tsNocheck
        )
    );
    notifier.done('Generate base statements in module.');

    for (const contract of moduleInterface.values()) {
        const contractSchema: SDK.SchemaContractV3 | undefined =
            moduleSchema?.module.contracts.get(contract.contractName);

        moduleSourceFile.addStatements(
            generateModuleContractStatements(
                contract.contractName,
                moduleClientId,
                moduleClientType,
                internalModuleClientId,
                moduleRef,
                contractSchema
            )
        );
        notifier.done(
            `Generate initialize statements for '${contract.contractName}' in module.`
        );

        const contractOutputFilePath = path.format({
            dir: outDirPath,
            name: `${outModuleName}_${sanitize(contract.contractName, {
                replacement: '-',
            })}`,
            ext: '.ts',
        });
        const contractSourceFile = project.createSourceFile(
            contractOutputFilePath,
            '',
            {
                overwrite: true,
            }
        );

        const contractClientType = `${toPascalCase(
            contract.contractName
        )}Contract`;
        const contractClientId = 'contractClient';

        contractSourceFile.addStatements(
            generateContractBaseStatements(
                contract.contractName,
                contractClientId,
                contractClientType,
                moduleRef,
                tsNocheck,
                contractSchema
            )
        );
        notifier.done(
            `Generate base statements for '${contract.contractName}'.`
        );

        for (const entrypointName of contract.entrypointNames) {
            const entrypointSchema =
                contractSchema?.receive.get(entrypointName);
            contractSourceFile.addStatements(
                generateContractEntrypointStatements(
                    contract.contractName,
                    contractClientId,
                    contractClientType,
                    entrypointName,
                    entrypointSchema
                )
            );
            notifier.done(
                `Generate statements for '${contract.contractName}.${entrypointName}'.`
            );
        }
    }
}

/**
 * Generate code for a smart contract module client.
 * @param moduleRef The module reference.
 * @param moduleClientId The identifier to use for the module client.
 * @param moduleClientType The identifier to use for the type of the module client.
 * @param internalModuleClientId The identifier to use for referencing the internal module client.
 * @param tsNocheck When `true` generate `// @ts-nocheck` annotations in each file.
 */
function generateModuleBaseStatements(
    moduleRef: SDK.ModuleReference.Type,
    moduleClientId: string,
    moduleClientType: string,
    internalModuleClientId: string,
    tsNocheck: boolean
): Array<tsm.StatementStructures | string> {
    const statements: Array<tsm.StatementStructures | string> = [];
    const moduleRefId = 'moduleReference';
    if (tsNocheck) {
        statements.push('// @ts-nocheck');
    }

    statements.push({
        kind: tsm.StructureKind.ImportDeclaration,
        namespaceImport: 'SDK',
        moduleSpecifier: '@concordium/web-sdk',
    });

    statements.push({
        kind: tsm.StructureKind.VariableStatement,
        isExported: true,
        declarationKind: tsm.VariableDeclarationKind.Const,
        docs: [
            'The reference of the smart contract module supported by the provided client.',
        ],
        declarations: [
            {
                name: moduleRefId,
                type: 'SDK.ModuleReference.Type',
                initializer: `/*#__PURE__*/ SDK.ModuleReference.fromHexString('${moduleRef.moduleRef}')`,
            },
        ],
    });

    statements.push({
        kind: tsm.StructureKind.Class,
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
        ctors: [
            {
                docs: [
                    'Constructor is only meant to be used internally in this module. Use functions such as `create` or `createUnchecked` for construction.',
                ],
                parameters: [
                    {
                        name: internalModuleClientId,
                        type: 'SDK.ModuleClient.Type',
                    },
                ],
                statements: `this.${internalModuleClientId} = ${internalModuleClientId};`,
            },
        ],
    });

    statements.push({
        kind: tsm.StructureKind.TypeAlias,
        docs: [
            `Client for an on-chain smart contract module with module reference '${moduleRef.moduleRef}', can be used for instantiating new smart contract instances.`,
        ],
        name: 'Type',
        isExported: true,
        type: moduleClientType,
    });

    const grpcClientId = 'grpcClient';
    statements.push({
        kind: tsm.StructureKind.Function,
        docs: [
            [
                `Construct a ${moduleClientType} client for interacting with a smart contract module on chain.`,
                'This function ensures the smart contract module is deployed on chain.',
                `@param {SDK.ConcordiumGRPCClient} ${grpcClientId} - The concordium node client to use.`,
                '@throws If failing to communicate with the concordium node or if the module reference is not present on chain.',
                `@returns {${moduleClientType}} A module client ensured to be deployed on chain.`,
            ].join('\n'),
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
        statements: [
            `const moduleClient = await SDK.ModuleClient.create(${grpcClientId}, ${moduleRefId});`,
            `return new ${moduleClientType}(moduleClient);`,
        ],
    });
    statements.push({
        kind: tsm.StructureKind.Function,
        docs: [
            [
                `Construct a ${moduleClientType} client for interacting with a smart contract module on chain.`,
                'It is up to the caller to ensure the module is deployed on chain.',
                `@param {SDK.ConcordiumGRPCClient} ${grpcClientId} - The concordium node client to use.`,
                `@returns {${moduleClientType}}`,
            ].join('\n'),
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
        statements: [
            `const moduleClient = SDK.ModuleClient.createUnchecked(${grpcClientId}, ${moduleRefId});`,
            `return new ${moduleClientType}(moduleClient);`,
        ],
    });

    statements.push({
        kind: tsm.StructureKind.Function,
        docs: [
            [
                `Construct a ${moduleClientType} client for interacting with a smart contract module on chain.`,
                'This function ensures the smart contract module is deployed on chain.',
                `@param {${moduleClientType}} ${moduleClientId} - The client of the on-chain smart contract module with referecence '${moduleRef.moduleRef}'.`,
                '@throws If failing to communicate with the concordium node or if the module reference is not present on chain.',
                `@returns {${moduleClientType}} A module client ensured to be deployed on chain.`,
            ].join('\n'),
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
        statements: `return SDK.ModuleClient.checkOnChain(${moduleClientId}.${internalModuleClientId});`,
    });

    statements.push({
        kind: tsm.StructureKind.Function,
        docs: [
            [
                'Get the module source of the deployed smart contract module.',
                `@param {${moduleClientType}} ${moduleClientId} - The client of the on-chain smart contract module with referecence '${moduleRef.moduleRef}'.`,
                '@throws {SDK.RpcError} If failing to communicate with the concordium node or module not found.',
                '@returns {SDK.VersionedModuleSource} Module source of the deployed smart contract module.',
            ].join('\n'),
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
        statements: `return SDK.ModuleClient.getModuleSource(${moduleClientId}.${internalModuleClientId});`,
    });
    return statements;
}

/**
 * Generate code in the module client specific to each contract in the module.
 * @param {string} contractName The name of the contract.
 * @param {string} moduleClientId The identifier for the module client.
 * @param {string} moduleClientType The identifier for the type of the module client.
 * @param {string} internalModuleClientId The identifier for the internal module client.
 * @param {SDK.ModuleReference.Type} moduleRef The reference of the module.
 * @param {SDK.SchemaContractV3} [contractSchema] The contract schema.
 * @returns {tsm.StatementStructures[]} List of statements to be included in the module source file.
 */
function generateModuleContractStatements(
    contractName: string,
    moduleClientId: string,
    moduleClientType: string,
    internalModuleClientId: string,
    moduleRef: SDK.ModuleReference.Type,
    contractSchema?: SDK.SchemaContractV3
): tsm.StatementStructures[] {
    const statements: tsm.StatementStructures[] = [];
    const transactionMetadataId = 'transactionMetadata';
    const parameterId = 'parameter';
    const signerId = 'signer';
    const initParameterTypeId = `${toPascalCase(contractName)}Parameter`;
    const base64InitParameterSchemaTypeId = `base64${toPascalCase(
        contractName
    )}ParameterSchema`;
    const initParameterJsonTypeId = `${toPascalCase(
        contractName
    )}ParameterSchemaJson`;
    const createInitParameterFnId = `create${toPascalCase(
        contractName
    )}Parameter`;
    const createInitParameterJsonFnId = `create${toPascalCase(
        contractName
    )}ParameterSchemaJson`;
    const createInitParameterFnWebWalletId = `create${toPascalCase(
        contractName
    )}ParameterWebWallet`;

    const initParameterSchemaType = contractSchema?.init?.parameter;

    if (initParameterSchemaType !== undefined) {
        statements.push({
            kind: tsm.StructureKind.VariableStatement,
            docs: [
                `Base64 encoding of the parameter schema type used when instantiating a new '${contractName}' smart contract instance.`,
            ],
            declarationKind: tsm.VariableDeclarationKind.Const,
            declarations: [
                {
                    name: base64InitParameterSchemaTypeId,
                    initializer: `'${Buffer.from(
                        SDK.serializeSchemaType(initParameterSchemaType)
                    ).toString('base64')}'`,
                },
            ],
        });
        const typeAndMapper = schemaAsNativeType(initParameterSchemaType);
        statements.push({
            kind: tsm.StructureKind.TypeAlias,
            docs: [
                `Parameter JSON type needed by the schema when instantiating a new '${contractName}' smart contract instance.`,
            ],
            name: initParameterJsonTypeId,
            type: typeAndMapper.jsonType,
        });

        if (initParameterSchemaType.type !== 'Unit') {
            statements.push({
                kind: tsm.StructureKind.TypeAlias,
                docs: [
                    `Parameter type transaction for instantiating a new '${contractName}' smart contract instance.`,
                ],
                isExported: true,
                name: initParameterTypeId,
                type: typeAndMapper.nativeType,
            });

            const mappedParameter = typeAndMapper.nativeToJson(parameterId);
            statements.push({
                kind: tsm.StructureKind.Function,
                docs: [
                    [
                        `Construct schema JSON representation used in transactions for instantiating a new '${contractName}' smart contract instance.`,
                        `@param {${initParameterTypeId}} ${parameterId} The structured parameter to construct from.`,
                        `@returns {${initParameterJsonTypeId}} The smart contract parameter JSON.`,
                    ].join('\n'),
                ],
                name: createInitParameterJsonFnId,
                parameters: [
                    {
                        type: initParameterTypeId,
                        name: parameterId,
                    },
                ],
                returnType: initParameterJsonTypeId,
                statements: [
                    ...mappedParameter.code,
                    `return ${mappedParameter.id};`,
                ],
            });
            statements.push({
                kind: tsm.StructureKind.Function,
                docs: [
                    [
                        `Construct Parameter type used in transactions for instantiating a new '${contractName}' smart contract instance.`,
                        `@param {${initParameterTypeId}} ${parameterId} The structured parameter to construct from.`,
                        '@returns {SDK.Parameter.Type} The smart contract parameter.',
                    ].join('\n'),
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
                statements: [
                    `return SDK.Parameter.fromBase64SchemaType(${base64InitParameterSchemaTypeId}, ${createInitParameterJsonFnId}(${parameterId}));`,
                ],
            });

            statements.push({
                kind: tsm.StructureKind.Function,
                docs: [
                    [
                        `Construct WebWallet parameter type used in transactions for instantiating a new '${contractName}' smart contract instance.`,
                        `@param {${initParameterTypeId}} ${parameterId} The structured parameter to construct from.`,
                        '@returns The smart contract parameter support by the WebWallet.',
                    ].join('\n'),
                ],
                isExported: true,
                name: createInitParameterFnWebWalletId,
                parameters: [
                    {
                        type: initParameterTypeId,
                        name: parameterId,
                    },
                ],
                statements: [
                    'return {',
                    `    parameters: ${createInitParameterJsonFnId}(${parameterId}),`,
                    '    schema: {',
                    "        type: 'TypeSchema' as const,",
                    `        value: SDK.toBuffer(${base64InitParameterSchemaTypeId}, 'base64')`,
                    '    },',
                    '}',
                ],
            });
        }
    } else {
        statements.push({
            kind: tsm.StructureKind.TypeAlias,
            docs: [
                `Parameter type transaction for instantiating a new '${contractName}' smart contract instance.`,
            ],
            isExported: true,
            name: initParameterTypeId,
            type: 'SDK.Parameter.Type',
        });
    }

    const initTakesNoParameter = initParameterSchemaType?.type === 'Unit';

    statements.push({
        kind: tsm.StructureKind.Function,
        docs: [
            [
                `Send transaction for instantiating a new '${contractName}' smart contract instance.`,
                `@param {${moduleClientType}} ${moduleClientId} - The client of the on-chain smart contract module with referecence '${moduleRef.moduleRef}'.`,
                `@param {SDK.ContractTransactionMetadata} ${transactionMetadataId} - Metadata related to constructing a transaction for a smart contract module.`,
                ...(initTakesNoParameter
                    ? []
                    : [
                          `@param {${initParameterTypeId}} ${parameterId} - Parameter to provide as part of the transaction for the instantiation of a new smart contract contract.`,
                      ]),
                `@param {SDK.AccountSigner} ${signerId} - The signer of the update contract transaction.`,
                '@throws If failing to communicate with the concordium node.',
                '@returns {SDK.TransactionHash.Type}',
            ].join('\n'),
        ],
        isExported: true,
        name: `instantiate${toPascalCase(contractName)}`,
        parameters: [
            {
                name: moduleClientId,
                type: moduleClientType,
            },
            {
                name: transactionMetadataId,
                type: 'SDK.ContractTransactionMetadata',
            },
            ...(initTakesNoParameter
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
        statements: [
            'return SDK.ModuleClient.createAndSendInitTransaction(',
            `    ${moduleClientId}.${internalModuleClientId},`,
            `    SDK.ContractName.fromStringUnchecked('${contractName}'),`,
            `    ${transactionMetadataId},`,
            ...(initParameterSchemaType === undefined
                ? [`    ${parameterId},`]
                : initParameterSchemaType.type === 'Unit'
                ? []
                : [`    ${createInitParameterFnId}(${parameterId}),`]),
            `    ${signerId}`,
            ');',
        ],
    });

    return statements;
}

/**
 * Generate code for a smart contract instance client.
 * @param {string} contractName The name of the smart contract.
 * @param {string} contractClientId The identifier to use for the contract client.
 * @param {string} contractClientType The identifier to use for the type of the contract client.
 * @param {SDK.ModuleReference.Type} moduleRef The module reference.
 * @param {boolean} tsNocheck When `true` generate `// @ts-nocheck` annotations in each file.
 * @param {SDK.SchemaContractV3} [contractSchema] The contract schema to use in the client.
 * @returns {Array<tsm.StatementStructures | string>} A list of statements to be included in the contract source file.
 */
function generateContractBaseStatements(
    contractName: string,
    contractClientId: string,
    contractClientType: string,
    moduleRef: SDK.ModuleReference.Type,
    tsNocheck: boolean,
    contractSchema?: SDK.SchemaContractV3
): Array<tsm.StatementStructures | string> {
    const statements: Array<tsm.StatementStructures | string> = [];
    const moduleRefId = 'moduleReference';
    const grpcClientId = 'grpcClient';
    const contractNameId = 'contractName';
    const genericContractId = 'genericContract';
    const contractAddressId = 'contractAddress';
    const blockHashId = 'blockHash';

    if (tsNocheck) {
        statements.push('// @ts-nocheck');
    }
    statements.push({
        kind: tsm.StructureKind.ImportDeclaration,
        namespaceImport: 'SDK',
        moduleSpecifier: '@concordium/web-sdk',
    });

    statements.push({
        kind: tsm.StructureKind.VariableStatement,
        docs: [
            'The reference of the smart contract module supported by the provided client.',
        ],
        isExported: true,
        declarationKind: tsm.VariableDeclarationKind.Const,
        declarations: [
            {
                name: moduleRefId,
                type: 'SDK.ModuleReference.Type',
                initializer: `/*#__PURE__*/ SDK.ModuleReference.fromHexString('${moduleRef.moduleRef}')`,
            },
        ],
    });

    statements.push({
        kind: tsm.StructureKind.VariableStatement,
        docs: ['Name of the smart contract supported by this client.'],
        isExported: true,
        declarationKind: tsm.VariableDeclarationKind.Const,
        declarations: [
            {
                name: contractNameId,
                type: 'SDK.ContractName.Type',
                initializer: `/*#__PURE__*/ SDK.ContractName.fromStringUnchecked('${contractName}')`,
            },
        ],
    });

    statements.push({
        kind: tsm.StructureKind.Class,
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
        ctors: [
            {
                kind: tsm.StructureKind.Constructor,
                parameters: [
                    { name: grpcClientId, type: 'SDK.ConcordiumGRPCClient' },
                    {
                        name: contractAddressId,
                        type: 'SDK.ContractAddress.Type',
                    },
                    { name: genericContractId, type: 'SDK.Contract' },
                ],
                statements: [
                    grpcClientId,
                    contractAddressId,
                    genericContractId,
                ].map((name) => `this.${name} = ${name};`),
            },
        ],
    });

    statements.push({
        kind: tsm.StructureKind.TypeAlias,
        docs: ['Smart contract client for a contract instance on chain.'],
        name: 'Type',
        isExported: true,
        type: contractClientType,
    });

    statements.push({
        kind: tsm.StructureKind.Function,
        docs: [
            [
                `Construct an instance of \`${contractClientType}\` for interacting with a '${contractName}' contract on chain.`,
                'Checking the information instance on chain.',
                `@param {SDK.ConcordiumGRPCClient} ${grpcClientId} - The client used for contract invocations and updates.`,
                `@param {SDK.ContractAddress.Type} ${contractAddressId} - Address of the contract instance.`,
                `@param {SDK.BlockHash.Type} [${blockHashId}] - Hash of the block to check the information at. When not provided the last finalized block is used.`,
                '@throws If failing to communicate with the concordium node or if any of the checks fails.',
                `@returns {${contractClientType}}`,
            ].join('\n'),
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
        statements: [
            `const ${genericContractId} = new SDK.Contract(${grpcClientId}, ${contractAddressId}, ${contractNameId});`,
            `await ${genericContractId}.checkOnChain({ moduleReference: ${moduleRefId}, blockHash: ${blockHashId} });`,
            `return new ${contractClientType}(`,
            `    ${grpcClientId},`,
            `    ${contractAddressId},`,
            `    ${genericContractId}`,
            ');',
        ],
    });

    statements.push({
        kind: tsm.StructureKind.Function,
        docs: [
            [
                `Construct the \`${contractClientType}\` for interacting with a '${contractName}' contract on chain.`,
                'Without checking the instance information on chain.',
                `@param {SDK.ConcordiumGRPCClient} ${grpcClientId} - The client used for contract invocations and updates.`,
                `@param {SDK.ContractAddress.Type} ${contractAddressId} - Address of the contract instance.`,
                `@returns {${contractClientType}}`,
            ].join('\n'),
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
        statements: [
            `const ${genericContractId} = new SDK.Contract(${grpcClientId}, ${contractAddressId}, ${contractNameId});`,
            `return new ${contractClientType}(`,
            `    ${grpcClientId},`,
            `    ${contractAddressId},`,
            `    ${genericContractId},`,
            ');',
        ],
    });

    statements.push({
        kind: tsm.StructureKind.Function,
        docs: [
            [
                'Check if the smart contract instance exists on the blockchain and whether it uses a matching contract name and module reference.',
                `@param {${contractClientType}} ${contractClientId} The client for a '${contractName}' smart contract instance on chain.`,
                `@param {SDK.BlockHash.Type} [${blockHashId}] A optional block hash to use for checking information on chain, if not provided the last finalized will be used.`,
                '@throws {SDK.RpcError} If failing to communicate with the concordium node or if any of the checks fails.',
            ].join('\n'),
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
        statements: `return ${contractClientId}.${genericContractId}.checkOnChain({moduleReference: ${moduleRefId}, blockHash: ${blockHashId} });`,
    });

    const eventParameterId = 'event';
    const eventParameterTypeId = 'Event';
    const eventParser = parseEventCode(eventParameterId, contractSchema?.event);
    if (eventParser !== undefined) {
        statements.push({
            kind: tsm.StructureKind.TypeAlias,
            docs: [`Contract event type for the '${contractName}' contract.`],
            isExported: true,
            name: eventParameterTypeId,
            type: eventParser.type,
        });

        statements.push({
            kind: tsm.StructureKind.Function,
            docs: [
                [
                    `Parse the contract events logged by the '${contractName}' contract.`,
                    `@param {SDK.ContractEvent.Type} ${eventParameterId} The unparsed contract event.`,
                    `@returns {${eventParameterTypeId}} The structured contract event.`,
                ].join('\n'),
            ],
            isExported: true,
            name: 'parseEvent',
            parameters: [
                {
                    name: eventParameterId,
                    type: 'SDK.ContractEvent.Type',
                },
            ],
            returnType: eventParameterTypeId,
            statements: [...eventParser.code, `return ${eventParser.id};`].join(
                '\n'
            ),
        });
    }
    return statements;
}

/**
 * Generate contract client statements for an entrypoint.
 * @param {string} contractName The name of the contract.
 * @param {string} contractClientId The identifier to use for the contract client.
 * @param {string} contractClientType The identifier to use for the type of the contract client.
 * @param {string} entrypointName The name of the entrypoint.
 * @param {SDK.SchemaFunctionV2} [entrypointSchema] The schema to use for the entrypoint.
 * @return {tsm.StatementStructures[]} List of statements related to an entrypoint.
 */
function generateContractEntrypointStatements(
    contractName: string,
    contractClientId: string,
    contractClientType: string,
    entrypointName: string,
    entrypointSchema?: SDK.SchemaFunctionV2
): tsm.StatementStructures[] {
    const statements: tsm.StatementStructures[] = [];
    const invokeMetadataId = 'invokeMetadata';
    const parameterId = 'parameter';
    const transactionMetadataId = 'transactionMetadata';
    const signerId = 'signer';
    const genericContractId = 'genericContract';
    const blockHashId = 'blockHash';
    const receiveParameterTypeId = `${toPascalCase(entrypointName)}Parameter`;
    const base64ReceiveParameterSchemaTypeId = `base64${toPascalCase(
        entrypointName
    )}ParameterSchema`;
    const receiveParameterJsonTypeId = `${toPascalCase(
        entrypointName
    )}ParameterSchemaJson`;
    const createReceiveParameterFnId = `create${toPascalCase(
        entrypointName
    )}Parameter`;
    const createReceiveParameterJsonFnId = `create${toPascalCase(
        entrypointName
    )}ParameterSchemaJson`;
    const createReceiveParameterFnWebWalletId = `create${toPascalCase(
        entrypointName
    )}ParameterWebWallet`;

    const receiveParameterSchemaType = entrypointSchema?.parameter;

    if (receiveParameterSchemaType !== undefined) {
        statements.push({
            kind: tsm.StructureKind.VariableStatement,
            docs: [
                `Base64 encoding of the parameter schema type for update transactions to '${entrypointName}' entrypoint of the '${contractName}' contract.`,
            ],
            declarationKind: tsm.VariableDeclarationKind.Const,
            declarations: [
                {
                    name: base64ReceiveParameterSchemaTypeId,
                    initializer: `'${Buffer.from(
                        SDK.serializeSchemaType(receiveParameterSchemaType)
                    ).toString('base64')}'`,
                },
            ],
        });

        const typeAndMapper = schemaAsNativeType(receiveParameterSchemaType);
        statements.push({
            kind: tsm.StructureKind.TypeAlias,
            docs: [
                `Parameter JSON type needed by the schema for update transaction for '${entrypointName}' entrypoint of the '${contractName}' contract.`,
            ],
            name: receiveParameterJsonTypeId,
            type: typeAndMapper.jsonType,
        });
        if (receiveParameterSchemaType.type !== 'Unit') {
            statements.push({
                kind: tsm.StructureKind.TypeAlias,
                docs: [
                    `Parameter type for update transaction for '${entrypointName}' entrypoint of the '${contractName}' contract.`,
                ],
                isExported: true,
                name: receiveParameterTypeId,
                type: typeAndMapper.nativeType,
            });

            const mappedParameter = typeAndMapper.nativeToJson(parameterId);

            statements.push({
                kind: tsm.StructureKind.Function,
                docs: [
                    [
                        `Construct schema JSON representation used in update transaction for '${entrypointName}' entrypoint of the '${contractName}' contract.`,
                        `@param {${receiveParameterTypeId}} ${parameterId} The structured parameter to construct from.`,
                        `@returns {${receiveParameterJsonTypeId}} The smart contract parameter JSON.`,
                    ].join('\n'),
                ],
                name: createReceiveParameterJsonFnId,
                parameters: [
                    {
                        type: receiveParameterTypeId,
                        name: parameterId,
                    },
                ],
                returnType: receiveParameterJsonTypeId,
                statements: [
                    ...mappedParameter.code,
                    `return ${mappedParameter.id};`,
                ],
            });
            statements.push({
                kind: tsm.StructureKind.Function,
                docs: [
                    [
                        `Construct Parameter type used in update transaction for '${entrypointName}' entrypoint of the '${contractName}' contract.`,
                        `@param {${receiveParameterTypeId}} ${parameterId} The structured parameter to construct from.`,
                        '@returns {SDK.Parameter.Type} The smart contract parameter.',
                    ].join('\n'),
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
                statements: [
                    `return SDK.Parameter.fromBase64SchemaType(${base64ReceiveParameterSchemaTypeId}, ${createReceiveParameterJsonFnId}(${parameterId}));`,
                ],
            });

            statements.push({
                kind: tsm.StructureKind.Function,
                docs: [
                    [
                        `Construct WebWallet parameter type used in update transaction for '${entrypointName}' entrypoint of the '${contractName}' contract.`,
                        `@param {${receiveParameterTypeId}} ${parameterId} The structured parameter to construct from.`,
                        '@returns The smart contract parameter support by the WebWallet.',
                    ].join('\n'),
                ],
                isExported: true,
                name: createReceiveParameterFnWebWalletId,
                parameters: [
                    {
                        type: receiveParameterTypeId,
                        name: parameterId,
                    },
                ],
                statements: [
                    'return {',
                    `    parameters: ${createReceiveParameterJsonFnId}(${parameterId}),`,
                    '    schema: {',
                    "        type: 'TypeSchema' as const,",
                    `        value: SDK.toBuffer(${base64ReceiveParameterSchemaTypeId}, 'base64')`,
                    '    },',
                    '}',
                ],
            });
        }
    } else {
        statements.push({
            kind: tsm.StructureKind.TypeAlias,
            docs: [
                `Parameter type  used in update transaction for '${entrypointName}' entrypoint of the '${contractName}' contract.`,
            ],
            isExported: true,
            name: receiveParameterTypeId,
            type: 'SDK.Parameter.Type',
        });
    }

    const receiveTakesNoParameter = receiveParameterSchemaType?.type === 'Unit';

    statements.push({
        kind: tsm.StructureKind.Function,
        docs: [
            [
                `Send an update-contract transaction to the '${entrypointName}' entrypoint of the '${contractName}' contract.`,
                `@param {${contractClientType}} ${contractClientId} The client for a '${contractName}' smart contract instance on chain.`,
                `@param {SDK.ContractTransactionMetadata} ${transactionMetadataId} - Metadata related to constructing a transaction for a smart contract.`,
                ...(receiveTakesNoParameter
                    ? []
                    : [
                          `@param {${receiveParameterTypeId}} ${parameterId} - Parameter to provide the smart contract entrypoint as part of the transaction.`,
                      ]),
                `@param {SDK.AccountSigner} ${signerId} - The signer of the update contract transaction.`,
                '@throws If the entrypoint is not successfully invoked.',
                '@returns {SDK.TransactionHash.Type} Hash of the transaction.',
            ].join('\n'),
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
            ...(receiveTakesNoParameter
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
        statements: [
            `return ${contractClientId}.${genericContractId}.createAndSendUpdateTransaction(`,
            `    SDK.EntrypointName.fromStringUnchecked('${entrypointName}'),`,
            '    SDK.Parameter.toBuffer,',
            `    ${transactionMetadataId},`,
            ...(receiveParameterSchemaType === undefined
                ? [`    ${parameterId},`]
                : receiveParameterSchemaType.type === 'Unit'
                ? []
                : [`    ${createReceiveParameterFnId}(${parameterId}),`]),
            `    ${signerId}`,
            ');',
        ],
    });

    statements.push({
        kind: tsm.StructureKind.Function,
        docs: [
            [
                `Dry-run an update-contract transaction to the '${entrypointName}' entrypoint of the '${contractName}' contract.`,
                `@param {${contractClientType}} ${contractClientId} The client for a '${contractName}' smart contract instance on chain.`,
                `@param {SDK.ContractAddress.Type | SDK.AccountAddress.Type} ${invokeMetadataId} - The address of the account or contract which is invoking this transaction.`,
                ...(receiveTakesNoParameter
                    ? []
                    : [
                          `@param {${receiveParameterTypeId}} ${parameterId} - Parameter to provide the smart contract entrypoint as part of the transaction.`,
                      ]),
                `@param {SDK.BlockHash.Type} [${blockHashId}] - Optional block hash allowing for dry-running the transaction at the end of a specific block.`,
                '@throws {SDK.RpcError} If failing to communicate with the concordium node or if any of the checks fails.',
                '@returns {SDK.InvokeContractResult} The result of invoking the smart contract instance.',
            ].join('\n'),
        ],
        isExported: true,
        name: `dryRun${toPascalCase(entrypointName)}`,
        parameters: [
            {
                name: contractClientId,
                type: contractClientType,
            },
            ...(receiveTakesNoParameter
                ? []
                : [
                      {
                          name: parameterId,
                          type: receiveParameterTypeId,
                      },
                  ]),
            {
                name: invokeMetadataId,
                type: 'SDK.ContractInvokeMetadata',
                initializer: '{}',
            },
            {
                name: blockHashId,
                hasQuestionToken: true,
                type: 'SDK.BlockHash.Type',
            },
        ],
        returnType: 'Promise<SDK.InvokeContractResult>',
        statements: [
            `return ${contractClientId}.${genericContractId}.dryRun.invokeMethod(`,
            `    SDK.EntrypointName.fromStringUnchecked('${entrypointName}'),`,
            `    ${invokeMetadataId},`,
            '    SDK.Parameter.toBuffer,',
            ...(receiveParameterSchemaType === undefined
                ? [`    ${parameterId},`]
                : receiveParameterSchemaType.type === 'Unit'
                ? []
                : [`    ${createReceiveParameterFnId}(${parameterId}),`]),
            `    ${blockHashId}`,
            ');',
        ],
    });

    const invokeResultId = 'invokeResult';
    const returnValueTokens = parseReturnValueCode(
        `${invokeResultId}.returnValue`,
        entrypointSchema?.returnValue
    );
    if (returnValueTokens !== undefined) {
        const returnValueTypeId = `ReturnValue${toPascalCase(entrypointName)}`;

        statements.push({
            kind: tsm.StructureKind.TypeAlias,
            docs: [
                `Return value for dry-running update transaction for '${entrypointName}' entrypoint of the '${contractName}' contract.`,
            ],
            isExported: true,
            name: returnValueTypeId,
            type: returnValueTokens.type,
        });

        statements.push({
            kind: tsm.StructureKind.Function,
            docs: [
                [
                    `Get and parse the return value from dry-running update transaction for '${entrypointName}' entrypoint of the '${contractName}' contract.`,
                    'Returns undefined if the result is not successful.',
                    '@param {SDK.InvokeContractResult} invokeResult The result from dry-running the transaction.',
                    `@returns {${returnValueTypeId} | undefined} The structured return value or undefined if result was not a success.`,
                ].join('\n'),
            ],
            isExported: true,
            name: `parseReturnValue${toPascalCase(entrypointName)}`,
            parameters: [
                {
                    name: invokeResultId,
                    type: 'SDK.InvokeContractResult',
                },
            ],
            returnType: `${returnValueTypeId} | undefined`,
            statements: [
                `if (${invokeResultId}.tag !== 'success') {`,
                '    return undefined;',
                '}',
                `if (${invokeResultId}.returnValue === undefined) {`,
                "    throw new Error('Unexpected missing \\'returnValue\\' in result of invocation. Client expected a V1 smart contract.');",
                '}',
                ...returnValueTokens.code,
                `return ${returnValueTokens.id};`,
            ],
        });
    }

    const errorMessageTokens = parseReturnValueCode(
        `${invokeResultId}.returnValue`,
        entrypointSchema?.error
    );
    if (errorMessageTokens !== undefined) {
        const errorMessageTypeId = `ErrorMessage${toPascalCase(
            entrypointName
        )}`;

        statements.push({
            kind: tsm.StructureKind.TypeAlias,
            docs: [
                `Error message for dry-running update transaction for '${entrypointName}' entrypoint of the '${contractName}' contract.`,
            ],
            isExported: true,
            name: errorMessageTypeId,
            type: errorMessageTokens.type,
        });

        statements.push({
            kind: tsm.StructureKind.Function,
            docs: [
                [
                    `Get and parse the error message from dry-running update transaction for '${entrypointName}' entrypoint of the '${contractName}' contract.`,
                    'Returns undefined if the result is not a failure.',
                    '@param {SDK.InvokeContractResult} invokeResult The result from dry-running the transaction.',
                    `@returns {${errorMessageTypeId} | undefined} The structured error message or undefined if result was not a failure or failed for other reason than contract rejectedReceive.`,
                ].join('\n'),
            ],
            isExported: true,
            name: `parseErrorMessage${toPascalCase(entrypointName)}`,
            parameters: [
                {
                    name: invokeResultId,
                    type: 'SDK.InvokeContractResult',
                },
            ],
            returnType: `${errorMessageTypeId} | undefined`,
            statements: [
                `if (${invokeResultId}.tag !== 'failure' || ${invokeResultId}.reason.tag !== 'RejectedReceive') {`,
                '    return undefined;',
                '}',
                `if (${invokeResultId}.returnValue === undefined) {`,
                "    throw new Error('Unexpected missing \\'returnValue\\' in result of invocation. Client expected a V1 smart contract.');",
                '}',
                ...errorMessageTokens.code,
                `return ${errorMessageTokens.id}`,
            ],
        });
    }
    return statements;
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
    /** The type in the Schema JSON format. */
    jsonType: string;
    /**
     * Provided the identifier for the input (of the above type), this generates
     * tokens for converting it into Schema JSON format.
     */
    nativeToJson: (nativeId: string) => { code: string[]; id: string };
    /**
     * Provided the identifier for the input (Schema JSON format), this generates
     * tokens for converting it into a native type (the above type).
     */
    jsonToNative: (jsonId: string) => { code: string[]; id: string };
};

/**
 * From a schema type construct a 'native' type, a type of the expected JSON format and converter functions
 * between this native type and the JSON format expected when serializing using a schema.
 *
 * @param {SDK.SchemaType} schemaType The schema type
 * @returns {SchemaNativeType} native type, JSON type and converters.
 */
function schemaAsNativeType(schemaType: SDK.SchemaType): SchemaNativeType {
    switch (schemaType.type) {
        case 'Unit':
            return {
                nativeType: '"Unit"',
                jsonType: '[]',
                jsonToNative() {
                    return { code: [], id: '[]' };
                },
                nativeToJson() {
                    return { code: [], id: '"Unit"' };
                },
            };
        case 'Bool':
            return {
                nativeType: 'boolean',
                jsonType: 'boolean',
                nativeToJson(nativeId) {
                    return { code: [], id: nativeId };
                },
                jsonToNative(jsonId) {
                    return { code: [], id: jsonId };
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
                jsonType: 'number',
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
                jsonType: 'bigint',
                nativeToJson(id) {
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
                jsonType: 'string',
                nativeToJson(id) {
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
                nativeType: 'SDK.CcdAmount.Type',
                jsonType: 'SDK.CcdAmount.SchemaValue',
                nativeToJson(id) {
                    const resultId = idGenerator('amount');
                    return {
                        code: [
                            `const ${resultId} = SDK.CcdAmount.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    const resultId = idGenerator('amount');
                    return {
                        code: [
                            `const ${resultId} = SDK.CcdAmount.fromSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
            };
        case 'AccountAddress':
            return {
                nativeType: 'SDK.AccountAddress.Type',
                jsonType: 'SDK.AccountAddress.SchemaValue',
                nativeToJson(id) {
                    const resultId = idGenerator('accountAddress');
                    return {
                        code: [
                            `const ${resultId} = SDK.AccountAddress.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
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
                jsonType: 'SDK.ContractAddress.SchemaValue',
                nativeToJson(id) {
                    const resultId = idGenerator('contractAddress');
                    return {
                        code: [
                            `const ${resultId} = SDK.ContractAddress.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
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
                jsonType: 'SDK.Timestamp.SchemaValue',
                nativeToJson(id) {
                    const resultId = idGenerator('timestamp');
                    return {
                        code: [
                            `const ${resultId} = SDK.Timestamp.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
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
                jsonType: 'SDK.Duration.SchemaValue',
                nativeToJson(id) {
                    const resultId = idGenerator('duration');
                    return {
                        code: [
                            `const ${resultId} = SDK.Duration.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
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
                nativeType: `[${first.nativeType}, ${second.nativeType}]`,
                jsonType: `[${first.jsonType}, ${second.jsonType}]`,
                nativeToJson(id) {
                    const resultId = idGenerator('pair');
                    const firstTokens = first.nativeToJson(`${id}[0]`);
                    const secondTokens = second.nativeToJson(`${id}[1]`);
                    return {
                        code: [
                            ...firstTokens.code,
                            ...secondTokens.code,
                            `const ${resultId}: ${this.jsonType} = [${firstTokens.id}, ${secondTokens.id}];`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    const resultId = idGenerator('pair');
                    const firstTokens = first.jsonToNative(`${id}[0]`);
                    const secondTokens = second.jsonToNative(`${id}[1]`);
                    return {
                        code: [
                            ...firstTokens.code,
                            ...secondTokens.code,
                            `const ${resultId}: ${this.nativeType} = [${firstTokens.id}, ${secondTokens.id}];`,
                        ],
                        id: resultId,
                    };
                },
            };
        case 'List': {
            const item = schemaAsNativeType(schemaType.item);
            return {
                nativeType: `Array<${item.nativeType}>`,
                jsonType: `Array<${item.jsonType}>`,
                nativeToJson(id) {
                    const resultId = idGenerator('list');
                    const itemId = idGenerator('item');
                    const tokens = item.nativeToJson(itemId);
                    // Check if any mapping is needed.
                    if (tokens.id === itemId && tokens.code.length === 0) {
                        return {
                            code: [],
                            id,
                        };
                    }
                    return {
                        code: [
                            `const ${resultId} = ${id}.map((${itemId}) => {`,
                            ...tokens.code,
                            `return ${tokens.id};`,
                            '});',
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    const resultId = idGenerator('list');
                    const itemId = idGenerator('item');
                    const tokens = item.jsonToNative(itemId);
                    // Check if any mapping is needed.
                    if (tokens.id === itemId && tokens.code.length === 0) {
                        return {
                            code: [],
                            id,
                        };
                    }
                    return {
                        code: [
                            `const ${resultId} = ${id}.map((${itemId}) => {`,
                            ...tokens.code,
                            `return ${tokens.id};`,
                            '});',
                        ],
                        id: resultId,
                    };
                },
            };
        }
        case 'Set': {
            const item = schemaAsNativeType(schemaType.item);
            return {
                nativeType: `Set<${item.nativeType}>`,
                jsonType: `Array<${item.jsonType}>`,
                nativeToJson(id) {
                    const resultId = idGenerator('set');
                    const valueId = idGenerator('value');
                    const valuesId = idGenerator('values');
                    const valueTokens = item.nativeToJson(valueId);
                    return {
                        code: [
                            `const ${valuesId} = [...${id}.values()]..map((${valueId}) => {`,
                            ...valueTokens.code,
                            `return ${valueTokens.id};`,
                            '});',
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    const resultId = idGenerator('set');
                    const valueId = idGenerator('value');
                    const valuesId = idGenerator('values');
                    const valueTokens = item.jsonToNative(valueId);
                    return {
                        code: [
                            `const ${valuesId} = ${id}.map((${valueId}) => {`,
                            ...valueTokens.code,
                            `return ${valueTokens.id}; `,
                            '});',
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
                nativeType: `Map<${key.nativeType}, ${value.nativeType}>`,
                jsonType: `[${key.jsonType}, ${value.jsonType}][]`,
                nativeToJson(id) {
                    const resultId = idGenerator('map');
                    const keyId = idGenerator('key');
                    const valueId = idGenerator('value');
                    const keyTokens = key.nativeToJson(keyId);
                    const valueTokens = value.nativeToJson(valueId);

                    return {
                        code: [
                            `const ${resultId}: ${this.jsonType} = [...${id}.entries()].map(([${keyId}, ${valueId}]) => {`,
                            ...keyTokens.code,
                            ...valueTokens.code,
                            `    return [${keyTokens.id}, ${valueTokens.id}];`,
                            '});',
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    const resultId = idGenerator('map');
                    const entriesId = idGenerator('entries');
                    const keyId = idGenerator('key');
                    const valueId = idGenerator('value');
                    const keyTokens = key.jsonToNative(keyId);
                    const valueTokens = value.jsonToNative(valueId);
                    return {
                        code: [
                            `const ${entriesId} = ${id}.map(([${keyId}, ${valueId}]) => {`,
                            ...keyTokens.code,
                            ...valueTokens.code,
                            `return [${keyTokens.id}, ${valueTokens.id}];`,
                            '});',
                            `const ${resultId}: ${this.nativeType} = Map.fromEntries(${entriesId});`,
                        ],
                        id: resultId,
                    };
                },
            };
        }
        case 'Array': {
            const item = schemaAsNativeType(schemaType.item);
            return {
                nativeType: `[${new Array(schemaType.size)
                    .fill(item.nativeType)
                    .join(', ')}]`,
                jsonType: `[${new Array(schemaType.size)
                    .fill(item.jsonType)
                    .join(', ')}]`,
                nativeToJson(id) {
                    const resultId = idGenerator('array');
                    const itemId = idGenerator('item');
                    const tokens = item.nativeToJson(itemId);
                    // Check if any mapping is needed.
                    if (tokens.id === itemId && tokens.code.length === 0) {
                        return {
                            code: [],
                            id,
                        };
                    }

                    return {
                        code: [
                            `const ${resultId} = ${id}.map((${itemId}) => {`,
                            ...tokens.code,
                            `    return ${tokens.id};`,
                            '});',
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    const resultId = idGenerator('array');
                    const itemId = idGenerator('item');
                    const tokens = item.jsonToNative(itemId);
                    // Check if any mapping is needed.
                    if (tokens.id === itemId && tokens.code.length === 0) {
                        return {
                            code: [],
                            id,
                        };
                    }
                    return {
                        code: [
                            `const ${resultId} = ${id}.map((${itemId}: any) => {`,
                            ...tokens.code,
                            `    return ${tokens.id};`,
                            '});',
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

            const variantTypes = variantFieldSchemas.map((variantSchema) =>
                variantSchema.nativeType === '"no-fields"'
                    ? `{ type: '${variantSchema.name}'}`
                    : `{ type: '${variantSchema.name}', content: ${variantSchema.nativeType} }`
            );

            const variantJsonTypes = variantFieldSchemas.map(
                (variantSchema) =>
                    `{'${variantSchema.name}' : ${variantSchema.jsonType} }`
            );

            return {
                nativeType: variantTypes.join(' | '),
                jsonType: variantJsonTypes.join(' | '),
                nativeToJson(id) {
                    const resultId = idGenerator('match');

                    const variantCases = variantFieldSchemas.flatMap(
                        (variantSchema) => {
                            const tokens = variantSchema.nativeToJson(
                                `${id}.content`
                            );
                            return [
                                `    case '${variantSchema.name}':`,
                                ...tokens.code,
                                `        ${resultId} = { ${defineProp(
                                    variantSchema.name,
                                    tokens.id
                                )} };`,
                                '    break;',
                            ];
                        }
                    );
                    return {
                        code: [
                            `let ${resultId}: ${this.jsonType};`,
                            `switch (${id}.type) {`,
                            ...variantCases,
                            '}',
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    const resultId = idGenerator('match');
                    //const variantKeyId = idGenerator('variantKey');

                    const variantIfStatements = variantFieldSchemas.map(
                        (variantFieldSchema) => {
                            const variantId = idGenerator('variant');
                            const variantTokens =
                                variantFieldSchema.jsonToNative(variantId);
                            return [
                                `if ('${variantFieldSchema.name}' in ${id}) {`,
                                ...(variantTokens.id === '"no-fields"'
                                    ? [
                                          `   ${resultId} = {`,
                                          `       type: '${variantFieldSchema.name}',`,
                                          '   };',
                                      ]
                                    : [
                                          `   const ${variantId} = ${accessProp(
                                              id,
                                              variantFieldSchema.name
                                          )};`,
                                          ...variantTokens.code,
                                          `   ${resultId} = {`,
                                          `       type: '${variantFieldSchema.name}',`,
                                          `       content: ${variantTokens.id},`,
                                          '   };',
                                      ]),
                                '}',
                            ].join('\n');
                        }
                    );
                    return {
                        code: [
                            `let ${resultId}: ${this.nativeType};`,
                            variantIfStatements.join(' else '),
                            ' else {',
                            '   throw new Error("Unexpected enum variant");',
                            '}',
                        ],
                        id: resultId,
                    };
                },
            };
        }
        case 'String':
            return {
                nativeType: 'string',
                jsonType: 'string',
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
                jsonType: 'SDK.ContractName.SchemaType',
                nativeToJson(id) {
                    const resultId = idGenerator('contractName');
                    return {
                        code: [
                            `const ${resultId} = SDK.ContractName.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
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
                jsonType: 'SDK.ReceiveName.SchemaType',
                nativeToJson(id) {
                    const resultId = idGenerator('receiveName');
                    return {
                        code: [
                            `const ${resultId} = SDK.ReceiveName.toSchemaValue(${id});`,
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
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
            const resultId = idGenerator('leb');
            return {
                nativeType: 'number | bigint',
                jsonType: 'string',
                nativeToJson(id) {
                    return {
                        code: [`const ${resultId} = BigInt(${id}).toString();`],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    return {
                        code: [`const ${resultId} = BigInt(${id});`],
                        id: resultId,
                    };
                },
            };
        case 'ByteList':
        case 'ByteArray':
            return {
                nativeType: 'SDK.HexString',
                jsonType: 'string',
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

function fieldToTypeAndMapper(fields: SDK.SchemaFields): SchemaNativeType {
    switch (fields.type) {
        case 'Named': {
            const schemas = fields.fields.map((named) => ({
                name: named.name,
                ...schemaAsNativeType(named.field),
            }));

            const objectFieldTypes = schemas.map((s) =>
                defineProp(s.name, s.nativeType)
            );
            const objectFieldJsonTypes = schemas.map((s) =>
                defineProp(s.name, s.jsonType)
            );

            return {
                nativeType: `{\n${objectFieldTypes.join('\n')}\n}`,
                jsonType: `{\n${objectFieldJsonTypes.join('\n')}\n}`,
                nativeToJson(id) {
                    const resultId = idGenerator('named');
                    const fields = schemas.map((s) => {
                        const fieldId = idGenerator('field');
                        const field = s.nativeToJson(fieldId);
                        return {
                            name: s.name,
                            constructTokens: [
                                `const ${fieldId} = ${accessProp(id, s.name)};`,
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
                            `const ${resultId} = {`,
                            ...fields.map((tokens) =>
                                defineProp(tokens.name, tokens.id)
                            ),
                            '};',
                        ],
                        id: resultId,
                    };
                },
                jsonToNative(id) {
                    const fields = schemas.map((s) => {
                        const fieldId = idGenerator('field');
                        const field = s.jsonToNative(fieldId);
                        return {
                            name: s.name,
                            constructTokens: [
                                `const ${fieldId} = ${accessProp(id, s.name)};`,
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
                            `const ${resultId} = {`,
                            ...fields.map((tokens) =>
                                defineProp(tokens.name, tokens.id)
                            ),
                            '};',
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
                    jsonType: `[${schema.jsonType}]`,
                    nativeToJson(id) {
                        const tokens = schema.nativeToJson(id);
                        return { code: tokens.code, id: `[${tokens.id}]` };
                    },
                    jsonToNative(id) {
                        return schema.jsonToNative(`${id}[0]`);
                    },
                };
            } else {
                return {
                    nativeType: `[${schemas
                        .map((s) => s.nativeType)
                        .join(', ')}]`,
                    jsonType: `[${schemas.map((s) => s.jsonType).join(', ')}]`,
                    nativeToJson(id) {
                        const resultId = idGenerator('unnamed');
                        const mapped = schemas.map((schema, index) =>
                            schema.nativeToJson(`${id}[${index}]`)
                        );
                        const constructFields = mapped.flatMap(
                            (tokens) => tokens.code
                        );
                        const fieldIds = mapped.map((s) => s.id);
                        return {
                            code: [
                                ...constructFields,
                                `const ${resultId}: ${
                                    this.jsonType
                                } = [${fieldIds.join(', ')}];`,
                            ],
                            id: resultId,
                        };
                    },
                    jsonToNative(id) {
                        const resultId = idGenerator('unnamed');
                        const mapped = schemas.map((schema, index) =>
                            schema.jsonToNative(`${id}[${index}]`)
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
            return {
                nativeType: '"no-fields"',
                jsonType: '[]',
                nativeToJson() {
                    return { code: [], id: '[]' };
                },
                jsonToNative() {
                    return { code: [], id: '"no-fields"' };
                },
            };
    }
}

/**
 * Information related to conversion between JSON and native type.
 */
type TypeConversionCode = {
    /** The native type. */
    type: string;
    /** Code to convert JSON either to or from native type.  */
    code: string[];
    /** Identifier for the result of the code. */
    id: string;
};

/**
 * Generate tokens for parsing a contract event.
 * @param {string} eventId Identifier of the event to parse.
 * @param {SDK.SchemaType} [schemaType] The schema to take into account when parsing.
 * @returns Undefined if no code should be produced.
 */
function parseEventCode(
    eventId: string,
    schemaType?: SDK.SchemaType
): TypeConversionCode | undefined {
    // No schema type is present so generate any code.
    if (schemaType === undefined) {
        return undefined;
    }
    const typeAndMapper = schemaAsNativeType(schemaType);
    const base64Schema = Buffer.from(
        SDK.serializeSchemaType(schemaType)
    ).toString('base64');

    const schemaJsonId = 'schemaJson';
    const tokens = typeAndMapper.jsonToNative(schemaJsonId);
    return {
        type: typeAndMapper.nativeType,
        code: [
            `const ${schemaJsonId} = <${typeAndMapper.jsonType}>SDK.ContractEvent.parseWithSchemaTypeBase64(${eventId}, '${base64Schema}');`,
            ...tokens.code,
        ],
        id: tokens.id,
    };
}

/**
 * Generate tokens for parsing a return type.
 * @param {string} returnTypeId Identifier of the return type to parse.
 * @param {SDK.SchemaType} [schemaType] The schema to take into account when parsing return type.
 * @returns Undefined if no code should be produced.
 */
function parseReturnValueCode(
    returnTypeId: string,
    schemaType?: SDK.SchemaType
): TypeConversionCode | undefined {
    // No schema type is present so don't generate any code.
    if (schemaType === undefined) {
        return undefined;
    }
    const typeAndMapper = schemaAsNativeType(schemaType);
    const base64Schema = Buffer.from(
        SDK.serializeSchemaType(schemaType)
    ).toString('base64');

    const schemaJsonId = 'schemaJson';
    const tokens = typeAndMapper.jsonToNative(schemaJsonId);
    return {
        type: typeAndMapper.nativeType,

        code: [
            `const ${schemaJsonId} = <${typeAndMapper.jsonType}>SDK.ReturnValue.parseWithSchemaTypeBase64(${returnTypeId}, '${base64Schema}');`,
            ...tokens.code,
        ],
        id: tokens.id,
    };
}

/**
 * Stateful function which suffixes a provided string with a number, which increments everytime this is called.
 * Used to ensure identifiers are unique.
 * @param {string} name Name of the identifier.
 * @returns {string} The name of the identifier suffixed with a number.
 */
const idGenerator = (() => {
    let counter = 0;
    return (name: string) => `${name}${counter++}`;
})();

/**
 * Create tokens for accessing a property on an object.
 * @param {string} objectId Identifier for the object.
 * @param {string} propId Identifier for the property.
 * @returns {string} Tokens for accessing the prop.
 */
function accessProp(objectId: string, propId: string): string {
    return identifierRegex.test(propId)
        ? `${objectId}.${propId}`
        : `${objectId}['${propId}']`;
}

/**
 * Create tokens for defining a property in an object
 * @param {string} propId Identifier for the property.
 * @param {string} valueId Identifier for the value.
 * @returns {string} Tokens for defining a property initialized to the value.
 */
function defineProp(propId: string, valueId: string): string {
    return identifierRegex.test(propId)
        ? `${propId}: ${valueId},`
        : `'${propId}': ${valueId},`;
}

/**
 * Regular expression matching the format of valid identifiers in javascript.
 *
 * > Note: this does not check for collision with keywords, which is not a problem
 * when accessing props or defining fields in an object.
 */
const identifierRegex = /^[$A-Z_][0-9A-Z_$]*$/i;

/**
 * Regular expression matching any character which cannot be used as an identifier.
 */
const notIdentifierSymbolRegex = /[^0-9A-Z_$]/gi;

/**
 * Remove any characters from a string which cannot be used as an identifier.
 * @param {string} input Input to sanitize.
 * @returns {string} Input string without any characters which are invalid for identifiers.
 *
 * @example
 * sanitizeIdentifier("some/weird variable.name") // "someweirdvariablename"
 */
function sanitizeIdentifier(input: string): string {
    return input.replaceAll(notIdentifierSymbolRegex, '');
}
