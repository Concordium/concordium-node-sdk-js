import { MAX_U8 } from '../constants.js';
import { Cbor, CborAccountAddress, CreatePLTPayload, TokenAmount, TokenMetadataUrl } from './index.js';

/**
 * The Token Module state represents global state information that is maintained by the Token Module,
 * and is returned as part of a `GetTokenInfo` query. It does not include state that is managed by
 * the Token Kernel, such as the token identifier, global supply and governance account. It also
 * does not (typically) include account-specific state, which is returned as part of
 * `GetAccountInfo` instead.
 *
 * The "name" and "metadata" fields are required. Other fields are optional, and can be omitted if
 * the module implementation does not support them. The structure supports additional fields for
 * future extensibility. Non-standard fields (i.e. any fields that are not defined by a standard,
 * and are specific to the module implementation) may be included, and their tags should be
 * prefixed with an underscore ("_") to distinguish them as such.
 */
export type TokenModuleState = {
    /** The name of the token. */
    name?: string;
    /** A URL pointing to the metadata of the token. */
    metadata?: TokenMetadataUrl.Type;
    /** The governance account for the token. */
    governanceAccount?: CborAccountAddress.Type;
    /** Whether the token supports an allow list */
    allowList?: boolean;
    /** Whether the token supports an deny list */
    denyList?: boolean;
    /** Whether the token is mintable */
    mintable?: boolean;
    /** Whether the token is burnable */
    burnable?: boolean;
    /** Whether the token operations are paused or not. */
    paused?: boolean;
    /** Any additional state information depending on the module implementation */
    [key: string]: unknown;
};

/**
 * The account state represents account-specific information that is maintained by the Token
 * Module, and is returned as part of a `GetAccountInfo` query. It does not include state that is
 * managed by the Token Kernel, such as the token identifier and account balance.
 *
 * All fields are optional, and can be omitted if the module implementation does not support them.
 * The structure supports additional fields for future extensibility. Non-standard fields (i.e. any
 * fields that are not defined by a standard, and are specific to the module implementation) may
 * be included, and their tags should be prefixed with an underscore ("_") to distinguish them
 * as such.
 */
export type TokenModuleAccountState = {
    /** Whether the account is on the allow list. */
    allowList?: boolean;
    /** Whether the account is on the deny list. */
    denyList?: boolean;
    /** Any additional state information depending on the module implementation. */
    [key: string]: unknown;
};

/**
 * These parameters are passed to the token module to initialize the token.
 * The token initialization update will also include the ticker symbol,
 * number of decimals, and a reference to the token module implementation.
 */
export type TokenInitializationParameters = {
    /** The name of the token. */
    name?: string;
    /** A URL pointing to the metadata of the token. */
    metadata?: TokenMetadataUrl.Type;
    /** The governance account for the token. */
    governanceAccount?: CborAccountAddress.Type;
    /** Whether the token supports an allow list */
    allowList?: boolean;
    /** Whether the token supports an deny list */
    denyList?: boolean;
    /** The initial amount of tokens to be minted */
    initialSupply?: TokenAmount.Type;
    /** Whether the token is mintable */
    mintable?: boolean;
    /** Whether the token is burnable */
    burnable?: boolean;
};

/**
 * Creates a PLT (protocol-level token) payload with the specified initialization parameters.
 *
 * @param payload - The base payload for the PLT, excluding the initialization parameters.
 * @param params - The initialization parameters for the token, such as name, metadata, governance account, and feature flags.
 * @returns The complete PLT payload including the CBOR-encoded initialization parameters.
 */
export function createPltPayload(
    payload: Omit<CreatePLTPayload, 'initializationParameters'>,
    params: TokenInitializationParameters
): CreatePLTPayload {
    if (payload.decimals < 0 || payload.decimals > MAX_U8) {
        throw new Error('Token decimals must be in the range 0..255 (inclusive).');
    }
    return {
        ...payload,
        initializationParameters: Cbor.encode(params),
    };
}
