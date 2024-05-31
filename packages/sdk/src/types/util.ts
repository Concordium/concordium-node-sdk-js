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
export type TypedJson<V> = {
    /** The type discriminator */
    ['@type']: TypedJsonDiscriminator;
    /** The serializable type value */
    value: V;
};

/**
 * Type predeicate for {@linkcode TypedJson}.
 *
 * @param value value to test
 * @returns boolean indicating whether `value` is {@linkcode TypedJson}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTypedJsonCandidate(value: unknown): value is TypedJson<any> {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    return ['@type', 'value'].every((name) => Object.getOwnPropertyNames(value).includes(name));
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
export abstract class TypedJsonParseError extends Error {
    public abstract readonly code: TypedJsonParseErrorCode;
    private _name: string = 'TypedJsonParseError';

    /**
     * @param {string} message - The error message.
     */
    constructor(message: string) {
        super(message);
    }

    public override get name() {
        return `${this._name}.${this.code}`;
    }
}

export class TypedJsonMalformedError extends TypedJsonParseError {
    public code = TypedJsonParseErrorCode.MALFORMED;
}

export class TypedJsonWrongTypeError extends TypedJsonParseError {
    public code = TypedJsonParseErrorCode.WRONG_TYPE;

    /**
     * @param {TypedJsonDiscriminator} expected - The discriminator expected by the typed JSON parser.
     * @param {TypedJsonDiscriminator} actual - The discriminator received by the typed JSON parser.
     */
    constructor(
        public readonly expected: TypedJsonDiscriminator,
        public readonly actual: TypedJsonDiscriminator
    ) {
        super(`Wrong type discriminator found in JSON. Expected "${expected}", found "${actual}"`);
    }
}

export class TypedJsonInvalidValueError extends TypedJsonParseError {
    public code = TypedJsonParseErrorCode.INVALID_VALUE;

    /**
     * @param {string} inner - The original cause of the error.
     */
    constructor(public readonly inner: unknown) {
        super(`Unable to parse value (${(inner as Error)?.message ?? inner})`);

        if (inner instanceof Error) {
            this.stack = inner.stack ?? this.stack;
        }
    }
}

/**
 * Creates a function to convert {@linkcode TypedJson} to their corresponding type instance.
 *
 * @template V - The JSON value
 * @template T - The type returned
 *
 * @param {TypedJsonDiscriminator} expectedTypeDiscriminator - The discriminator expected in the JSON string parsed
 * @param {Function} toType - A function converting values of type `V` to instances of type `T`
 *
 * @throws {TypedJsonParseError} {@linkcode TypedJsonParseError} if the returned function fails to parse the passed value.
 *
 * @returns The JSON parser function
 */
export function makeFromTypedJson<V, T>(expectedTypeDiscriminator: TypedJsonDiscriminator, toType: (value: V) => T) {
    return ({ ['@type']: type, value }: TypedJson<V>): T | V => {
        if (type === undefined || value === undefined) {
            throw new TypedJsonMalformedError('Expected both "@type" and "value" properties to be available in JSON');
        }

        if (expectedTypeDiscriminator !== type) {
            throw new TypedJsonWrongTypeError(expectedTypeDiscriminator, type);
        }

        try {
            return toType(value);
        } catch (e) {
            // Value cannot be successfully parsed
            throw new TypedJsonInvalidValueError(value);
        }
    };
}
