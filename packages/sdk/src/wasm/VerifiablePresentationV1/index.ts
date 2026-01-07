/**
 * @fileoverview Concordium Verifiable Presentation V1 API
 *
 * This module provides types and functions for working with verifiable presentations
 * on the Concordium blockchain. It includes support for creating presentation requests,
 * generating zero-knowledge proofs, and managing audit records for verification events.
 *
 * Key components:
 * - VerifiablePresentationRequestV1: For creating and managing presentation requests
 * - VerifiablePresentationV1: For creating and verifying presentations with ZK proofs
 * - VerificationAuditRecordV1: For public audit trails of verification events
 * - VerifiableCredentialV1: For working with verifiable credentials
 */
import * as VerificationAuditRecordV1 from './audit-record.js';
import * as VerifiableCredentialV1 from './credential.js';
import * as VerifiablePresentationV1 from './proof.js';
import * as VerificationRequestV1 from './request.js';

export {
    /** Namespace for verification request operations */
    VerificationRequestV1,
    /** Namespace for verifiable presentation proof operations */
    VerifiablePresentationV1,
    /** Namespace for verification audit record operations */
    VerificationAuditRecordV1,
    /** Namespace for verifiable credential operations */
    VerifiableCredentialV1,
};

/** Export all common types used across the verifiable presentation system */
export * from './types.js';
