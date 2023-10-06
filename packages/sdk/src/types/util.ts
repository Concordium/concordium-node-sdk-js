/**
 * Discriminator for {@linkcode TypedJson}. The member used to identify each type is
 * exported from each type module and can be accessed through named export `JSON_DISCRIMINATOR`.
 */
export enum TypedJsonDiscriminator {
    AccountAddress = 'ccd_account_address',
    BlockHash = 'ccd_block_hash',
    CcdAmount = 'ccd_ccd_amount',
    ContractAddress = 'ccd_contract_address',
    ContractName = 'ccd_contract_name',
    CredentialRegistrationId = 'ccd_cred_reg_id',
    DataBlob = 'ccd_data_blob',
    Duration = 'ccd_duration',
    Energy = 'ccd_energy',
    EntrypointName = 'ccd_entrypoint_name',
    InitName = 'ccd_init_name',
    ModuleReference = 'ccd_module_reference',
    Parameter = 'ccd_parameter',
    ReceiveName = 'ccd_receive_name',
    ReturnValue = 'ccd_return_value',
    SequenceNumber = 'ccd_sequence_number',
    Timestamp = 'ccd_timestamp',
    TransactionExpiry = 'ccd_transaction_expiry',
    TransactionHash = 'ccd_transaction_hash',
}

/**
 * Type describing the JSON representation of strong types used in the SDK.
 *
 * @template V - The serializable JSON value
 */
export interface TypedJson<V> {
    /** The type discriminator */
    ['@type']: TypedJsonDiscriminator;
    /** The serializable type value */
    value: V;
}

/**
 * Base class for concordium domain types
 *
 * @template D - The JSON discriminator
 * @template V - The serializable JSON value
 */
export abstract class TypeBase<V> implements ToTypedJson<V> {
    protected abstract typedJsonType: TypedJsonDiscriminator;
    protected abstract get serializable(): V;

    public toTypedJSON(): TypedJson<V> {
        return {
            ['@type']: this.typedJsonType,
            value: this.serializable,
        };
    }
}

/**
 * Common interface implemented by strong types used in the SDK
 * for converting instances of the type to types of {@linkcode TypedJson}.
 *
 * @template D - The JSON discriminator
 * @template V - The serializable JSON value
 */
export interface ToTypedJson<V> {
    /**
     * Converts type to {@linkcode TypedJson}
     *
     * @returns {TypedJson} The typed JSON.
     */
    toTypedJSON(): TypedJson<V>;
}

/**
 * Describes the type of the JsonParseError.
 */
export enum TypedJsonParseErrorCode {
    /** Malformed JSON passed to parser function */
    MALFORMED = 'MALFORMED',
    /** JSON passed to parser function had unexpected {@linkcode TypedJsonDiscriminator} type discriminator */
    WRONG_TYPE = 'WRONG_TYPE',
    /** Value could not be parsed successfully */
    INVALID_VALUE = 'INVALID_VALUE',
}

/**
 * Error thrown from trying to parse objects of type {@linkcode TypedJson}
 */
export class TypedJsonParseError extends Error {
    /**
     * @param {TypedJsonParseErrorCode} code - The error code.
     * @param {string} message - The error message.
     */
    constructor(
        public readonly code: TypedJsonParseErrorCode,
        message: string
    ) {
        super(message);
        this.name = 'TypedJsonParseError'; // convention for discriminating between error types.
    }

    /**
     * Translates errors to {@linkcode TypedJsonParseError} parse error of
     * type {@linkcode TypedJsonParseErrorCode.INVALID_VALUE} `INVALID_VALUE`.
     *
     * @param {unknown} error - An error of uknown type.
     * @returns {TypedJsonParseError} The tranlated error.
     */
    public static fromParseValueError(error: unknown): TypedJsonParseError {
        return new TypedJsonParseError(
            TypedJsonParseErrorCode.INVALID_VALUE,
            (error as Error)?.message ?? `${error}`
        );
    }
}

/**
 * Determines if error is of type {@linkcode TypedJsonParseError}
 */
export const isTypedJsonParseError = (
    error: unknown
): error is TypedJsonParseError => error instanceof TypedJsonParseError;

/**
 * Creates a function to convert {@linkcode TypedJson} to their corresponding type instance.
 *
 * @template V - The JSON value
 * @template T - The type returned
 *
 * @param {D} expectedTypeDiscriminator - The discriminator expected in the JSON string parsed
 * @param {Function} toType - A function converting values of type `V` to instances of type `T`
 *
 * @throws {TypedJsonParseError} {@linkcode TypedJsonParseError} if the returned function fails to parse the passed value.
 *
 * @returns The JSON parser function
 */
export function makeFromTypedJson<V, T>(
    expectedTypeDiscriminator: TypedJsonDiscriminator,
    toType: (value: V) => T
) {
    return ({ ['@type']: type, value }: TypedJson<V>): T | V => {
        if (!type) {
            throw new TypedJsonParseError(
                TypedJsonParseErrorCode.MALFORMED,
                'Received malformed JSON string'
            );
        }

        if (expectedTypeDiscriminator !== type) {
            throw new TypedJsonParseError(
                TypedJsonParseErrorCode.WRONG_TYPE,
                `Wrong type discriminator found when parsing JSON. Expected "${expectedTypeDiscriminator}", found "${type}"`
            );
        }

        try {
            return toType(value);
        } catch (e) {
            // Value cannot be successfully parsed
            throw TypedJsonParseError.fromParseValueError(e);
        }
    };
}
