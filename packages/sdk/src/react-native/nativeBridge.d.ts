type WalletSeed = { seed: string; network: 'Mainnet' | 'Testnet' };
type IdentityPath = { provider: number; index: number };
type CredentialIssuer = { index: bigint; subindex: bigint };
type ModuleSchema = { bytes: ArrayBuffer; contractName: string; version: number | undefined };
type IdentityKey = (seed: WalletSeed, identity: IdentityPath) => ArrayBuffer;
type AccountKey = (seed: WalletSeed, identity: IdentityPath, counter: number) => ArrayBuffer;
type VerifiableCredentialKey = (seed: WalletSeed, issuer: CredentialIssuer, counter: number) => ArrayBuffer;
type JsonOperation<T = string> = (input: string, options?: NativeWorkOptions) => Promise<T>;

/** Cancelling drops the native result. A running Rust job retains its worker slot until it finishes. */
export type NativeWorkOptions = { signal: AbortSignal };

/** Stable tags attached to errors raised by the native bindings. */
export interface NativeError extends Error {
    readonly tag:
        | 'InvalidSeed'
        | 'InvalidNetwork'
        | 'InvalidInput'
        | 'DerivationFailed'
        | 'RequestFailed'
        | 'WorkerFailed'
        | 'RandomnessUnavailable'
        | 'WorkerBusy'
        | 'OperationFailed'
        | 'SchemaFailed';
}

export declare const bindings: {
    generateMnemonicEntropy(): ArrayBuffer;
    generateIdentitySeed(): string;
    generateValidatorKeyFixture(account: string): Promise<string>;

    createIdentityRequest(
        seed: string,
        network: string,
        identityIndex: number,
        input: string,
        options?: NativeWorkOptions
    ): Promise<string>;
    createIdentityRequestWithKeys: JsonOperation;
    createIdentityRecoveryRequest(
        seed: string,
        network: string,
        identityIndex: number,
        input: string,
        options?: NativeWorkOptions
    ): Promise<string>;
    createIdentityRecoveryRequestWithKeys: JsonOperation;
    getAccountSigningKey: AccountKey;
    getAccountPublicKey: AccountKey;
    getCredentialId(seed: WalletSeed, identity: IdentityPath, counter: number, commitmentKey: string): ArrayBuffer;
    getPrfKey: IdentityKey;
    getIdCredSec: IdentityKey;
    getSignatureBlindingRandomness: IdentityKey;
    getAttributeCommitmentRandomness(
        seed: WalletSeed,
        identity: IdentityPath,
        counter: number,
        attribute: number
    ): ArrayBuffer;
    getVerifiableCredentialSigningKey: VerifiableCredentialKey;
    getVerifiableCredentialPublicKey: VerifiableCredentialKey;
    getVerifiableCredentialBackupEncryptionKey(seed: WalletSeed): ArrayBuffer;
    generateUnsignedCredential: JsonOperation;
    createUnsignedCredentialV1: JsonOperation;
    getDeploymentDetails(signatures: string[], unsignedInfo: string, expiry: bigint): Promise<string>;
    getDeploymentInfo(signatures: string[], unsignedInfo: string): Promise<string>;
    serializeCredentialDeploymentPayload(signatures: string[], unsignedInfo: string): Promise<ArrayBuffer>;
    deserializeCredentialDeployment(input: ArrayBuffer): Promise<string>;
    createIdProof: JsonOperation;
    verifyIdProof: JsonOperation<boolean>;
    createWeb3IdProof: JsonOperation;
    verifyWeb3IdCredentialSignature: JsonOperation<boolean>;
    verifyPresentation: JsonOperation;
    createPresentationV1: JsonOperation;
    verifyPresentationV1: JsonOperation;
    createVerificationRequestV1Anchor: JsonOperation<ArrayBuffer>;
    computeVerificationRequestV1AnchorHash: JsonOperation<ArrayBuffer>;
    createVerificationAuditV1Anchor: JsonOperation<ArrayBuffer>;
    computeVerificationAuditV1AnchorHash: JsonOperation<ArrayBuffer>;
    getInitContractParameterSchema(schema: ModuleSchema): Promise<ArrayBuffer>;
    getReceiveContractParameterSchema(schema: ModuleSchema, entrypoint: string): Promise<ArrayBuffer>;
    serializeInitContractParameters(schema: ModuleSchema, value: string, verbose: boolean): Promise<ArrayBuffer>;
    serializeReceiveContractParameters(
        schema: ModuleSchema,
        entrypoint: string,
        value: string,
        verbose: boolean
    ): Promise<ArrayBuffer>;
    serializeTypeValue(schema: ArrayBuffer, value: string, verbose: boolean): Promise<ArrayBuffer>;
    deserializeTypeValue(schema: ArrayBuffer, value: ArrayBuffer, verbose: boolean): Promise<string>;
    displayTypeSchemaTemplate(schema: ArrayBuffer): Promise<string>;
    deserializeState(schema: ModuleSchema, value: ArrayBuffer, verbose: boolean): Promise<string>;
    deserializeReceiveReturnValue(
        schema: ModuleSchema,
        entrypoint: string,
        value: ArrayBuffer,
        verbose: boolean
    ): Promise<string>;
    deserializeInitError(schema: ModuleSchema, value: ArrayBuffer, verbose: boolean): Promise<string>;
    deserializeReceiveError(
        schema: ModuleSchema,
        entrypoint: string,
        value: ArrayBuffer,
        verbose: boolean
    ): Promise<string>;
};

export type NativeBindings = typeof bindings;
