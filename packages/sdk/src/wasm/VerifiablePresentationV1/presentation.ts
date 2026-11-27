import type * as VerifiableCredentialV1 from './credential.js';
import { GivenContextJSON, givenContextFromJSON, givenContextToJSON } from './internal.js';
import type { GivenContext } from './types.js';

/**
 * Context information for a verifiable presentation proof.
 * This extends the request context by filling in the requested context
 * information with actual values provided by the presenter.
 */
export type Context = {
    /** Type identifier for the context format */
    type: 'ConcordiumContextInformationV1';
    /** Context information that was already provided in the request */
    given: GivenContext[];
    /** Context information that was requested and is now filled with actual values */
    requested: GivenContext[];
};

export type ContextJSON = Pick<Context, 'type'> & { given: GivenContextJSON[]; requested: GivenContextJSON[] };

export function proofContextToJSON(context: Context): ContextJSON {
    return {
        type: context.type,
        given: context.given.map(givenContextToJSON),
        requested: context.requested.map(givenContextToJSON),
    };
}

export function proofContextFromJSON(context: ContextJSON): Context {
    return {
        type: context.type,
        given: context.given.map(givenContextFromJSON),
        requested: context.requested.map(givenContextFromJSON),
    };
}

/**
 * A proof that establishes that the owner of the credential has indeed created
 * the presentation. At present this is a list of signatures.
 */
export type WeakLinkingProof = {
    /** When the statement was created, serialized as an ISO string */
    created: string;
    /** The proof value */
    proofValue: string;
    /** The proof type */
    type: 'ConcordiumWeakLinkingProofV1';
};

/**
 * A verifiable presentation containing zero-knowledge proofs of credential statements.
 * This class represents a complete response to a verifiable presentation request,
 * including the context, credentials, and cryptographic proofs.
 */
class VerifiablePresentationV1 {
    /**
     * Creates a new verifiable presentation.
     *
     * @param presentationContext - The complete context for this presentation
     * @param verifiableCredential - Array of verifiable credentials with proofs
     * @param proof - Weak linking proof
     */
    constructor(
        public readonly presentationContext: Context,
        public readonly verifiableCredential: VerifiableCredentialV1.Type[],
        public readonly proof: WeakLinkingProof
    ) {}

    /**
     * Serializes the verifiable presentation to a JSON representation.
     *
     * @returns The JSON representation of this presentation
     */
    public toJSON(): JSON {
        return {
            type: ['VerifiablePresentation', 'ConcordiumVerifiablePresentationV1'],
            presentationContext: proofContextToJSON(this.presentationContext),
            verifiableCredential: this.verifiableCredential,
            proof: this.proof,
        };
    }
}

/**
 * A verifiable presentation containing zero-knowledge proofs of credential statements.
 * This class represents a complete response to a verifiable presentation request,
 * including the context, credentials, and cryptographic proofs.
 */
export type Type = VerifiablePresentationV1;

/**
 * JSON representation of a verifiable presentation.
 * Used for serialization and network transmission of presentation data.
 */
export type JSON = {
    type: ['VerifiablePresentation', 'ConcordiumVerifiablePresentationV1'];
    /** The presentation context with serialized context information */
    presentationContext: ContextJSON;
    /** Array of verifiable credentials with their proofs */
    verifiableCredential: VerifiableCredentialV1.Type[];
    /** Optional weak linking proof for account-based credentials */
    proof: WeakLinkingProof;
};

/**
 * Deserializes a verifiable presentation from its JSON representation.
 *
 * This function reconstructs the presentation object from JSON data, handling
 * the conversion of serialized context information back to proper types.
 *
 * @param value - The JSON representation to deserialize
 * @returns The deserialized verifiable presentation
 */
export function fromJSON(value: JSON): VerifiablePresentationV1 {
    const presentationContext: Context = proofContextFromJSON(value.presentationContext);
    return new VerifiablePresentationV1(presentationContext, value.verifiableCredential, value.proof);
}
