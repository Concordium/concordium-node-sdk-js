import type { JsonString } from '../types.js';

/**
 * Discriminator for {@link TypedJson}.
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
 */
export interface TypedJson<V> {
    /** The type discriminator */
    ['@type']: TypedJsonDiscriminator;
    /** The type value */
    value: V;
}

/**
 * Base class for concordium domain types
 *
 * @template D - The JSON discriminator
 * @template V - The JSON value
 */
export abstract class TypeBase<V> implements ToTypedJson<V> {
    protected abstract jsonType: TypedJsonDiscriminator;
    protected abstract get jsonValue(): V;

    public toJSON(): TypedJson<V> {
        return { ['@type']: this.jsonType, value: this.jsonValue };
    }
}

/**
 * Common interface implemented by strong types used in the SDK
 * for converting instances of the type to types of {@link TypedJson}.
 *
 * @template D - The JSON discriminator
 * @template V - The JSON value
 */
export interface ToTypedJson<V> {
    /**
     * Converts type to {@link TypedJson}
     *
     * @returns {TypedJson} The typed JSON.
     */
    toJSON(): TypedJson<V>;
}

/**
 * Describes the type of the JsonParseError.
 */
export enum TypedJsonParseErrorType {
    /** Malformed JSON passed to parser function */
    Malformed,
    /** JSON passed to parser function had unexpected {@link TypedJsonDiscriminator} type discriminator */
    WrongType,
    /** Value could not be parsed successfully */
    InvalidValue,
}

/**
 * Error thrown from trying to parse objects of type {@link TypedJson}
 */
export class TypedJsonParseError extends Error {
    /**
     * @param {TypedJsonParseErrorType} type - The error type.
     * @param {string} message - The error message.
     */
    constructor(
        public readonly type: TypedJsonParseErrorType,
        message: string
    ) {
        super(message);
    }

    public static fromParseValueError(e: unknown): TypedJsonParseError {
        return new TypedJsonParseError(
            TypedJsonParseErrorType.InvalidValue,
            (e as Error)?.message ?? `${e}`
        );
    }
}

/**
 * Determines if error is of type {@link TypedJsonParseError}
 */
export const isJsonParseError = (
    error: unknown
): error is TypedJsonParseError => error instanceof TypedJsonParseError;

interface Class<V, T> {
    new (v: V): T;
}

/**
 * Creates a function to convert typed JSON strings to their corresponding type instance.
 *
 * @template V - The JSON value
 * @param {D} expectedTypeDiscriminator - The discriminator expected in the JSON string parsed
 * @returns The JSON parser function
 */
export function fromTypedJson<V, T>(
    expectedTypeDiscriminator: TypedJsonDiscriminator,
    Class: Class<V, T>
): (json: JsonString) => V;
/**
 * Creates a function to convert typed JSON strings to their corresponding type instance.
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
export function fromTypedJson<V, T>(
    expectedTypeDiscriminator: TypedJsonDiscriminator,
    toType: (value: V) => T
): (json: JsonString) => T;
export function fromTypedJson<V, T>(
    expectedTypeDiscriminator: TypedJsonDiscriminator,
    dyn: ((value: V) => T) | Class<V, T>
) {
    return (json: JsonString): T | V => {
        const { ['@type']: type, value: value }: TypedJson<V> =
            JSON.parse(json);

        if (!type || !value) {
            throw new TypedJsonParseError(
                TypedJsonParseErrorType.Malformed,
                'Received malformed JSON string'
            );
        }

        if (expectedTypeDiscriminator !== type) {
            throw new TypedJsonParseError(
                TypedJsonParseErrorType.WrongType,
                `Wrong type discriminator found when parsing JSON. Expected "${expectedTypeDiscriminator}", found "${type}"`
            );
        }

        /**
         * Parses the value
         */
        const parse = () => {
            try {
                return new (dyn as Class<V, T>)(value);
            } catch (e) {
                // thrown if `dyn` is not newable
                if (e instanceof TypeError) {
                    return (dyn as (value: V) => T)(value);
                }

                throw e;
            }
        };

        try {
            return parse();
        } catch (e) {
            // Value cannot be successfully parsed
            throw TypedJsonParseError.fromParseValueError(e);
        }
    };
}
