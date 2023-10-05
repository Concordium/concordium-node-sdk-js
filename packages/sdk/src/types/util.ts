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
    ModuleClient = 'ccd_module_client',
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
export interface TypedJson<D extends TypedJsonDiscriminator, V> {
    /** The type discriminator */
    __ccdType: D;
    /** The type value */
    __ccdValue: V;
}

/**
 * Base class for concordium domain types
 *
 * @template D - The JSON discriminator
 * @template V - The JSON value
 */
export abstract class TypeBase<D extends TypedJsonDiscriminator, V>
    implements ToTypedJson<D, V>
{
    protected abstract get jsonValue(): V;
    protected abstract jsonType: D;

    toJSON(): TypedJson<D, V> {
        return { __ccdType: this.jsonType, __ccdValue: this.jsonValue };
    }
}

/**
 * Common interface implemented by strong types used in the SDK
 * for converting instances of the type to types of {@link TypedJson}.
 *
 * @template D - The JSON discriminator
 * @template V - The JSON value
 */
export interface ToTypedJson<D extends TypedJsonDiscriminator, V> {
    /**
     * Converts type to {@link TypedJson}
     *
     * @returns {TypedJson} The typed JSON.
     */
    toJSON(): TypedJson<D, V>;
}

/**
 * Describes the type of the JsonParseError.
 */
export enum TypedJsonParseErrorType {
    /** Malformed JSON passed to parser function */
    Malformed,
    /** JSON passed to parser function had unexpected {@link TypedJsonDiscriminator} type discriminator */
    WrongType,
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
}

/**
 * Determines if error is of type {@link TypedJsonParseError}
 */
export const isJsonParseError = (
    error: unknown
): error is TypedJsonParseError => error instanceof TypedJsonParseError;

/**
 * Creates a function to convert typed JSON strings to their corresponding type instance.
 *
 * @template D - The JSON discriminator
 * @template V - The JSON value
 * @template T - The type returned
 *
 * @param {D} expectedTypeDiscriminator - The discriminator expected in the JSON string parsed
 * @param {Function} toType - A function converting values of type `V` to instances of type `T`
 *
 * @returns The JSON parser function
 */
export const fromTypedJson =
    <D extends TypedJsonDiscriminator, V, T>(
        expectedTypeDiscriminator: D,
        toType: (value: V) => T
    ) =>
    (json: JsonString): T => {
        const { __ccdType: type, __ccdValue: value }: TypedJson<D, V> =
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

        return toType(value);
    };
