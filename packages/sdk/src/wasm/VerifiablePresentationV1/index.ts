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
 * - VerificationAuditRecord: For public audit trails of verification events
 * - PrivateVerificationAuditRecord: For private audit records with full data
 */
import * as VerificationAuditRecordV1 from './audit-record.js';
import * as VerifiablePresentationV1 from './proof.js';
import * as VerifiablePresentationRequestV1 from './request.js';

export {
    /** Namespace for verifiable presentation request operations */
    VerifiablePresentationRequestV1,
    /** Namespace for verifiable presentation proof operations */
    VerifiablePresentationV1,
    /** Namespace for verification audit record operations */
    VerificationAuditRecordV1,
};

/** Export all common types used across the verifiable presentation system */
export * from './types.js';
