use super::{on_worker, parse_input, IdentityError};
use concordium_rust_bindings_wallet::{aux_functions, presentation};

macro_rules! proof {
    ($name:ident, $result:ty, $call:expr) => {
        #[uniffi::export]
        pub async fn $name(input: String) -> Result<$result, IdentityError> {
            on_worker(move || $call(input)).await
        }
    };
}

fn operation_error(_: anyhow::Error) -> IdentityError {
    IdentityError::OperationFailed
}

proof!(create_id_proof, String, |input: String| {
    aux_functions::create_id_proof_aux(parse_input(&input)?).map_err(operation_error)
});
proof!(create_web3_id_proof, String, |input: String| {
    aux_functions::create_web3_id_proof_aux(parse_input(&input)?).map_err(operation_error)
});
proof!(
    verify_web3_id_credential_signature,
    bool,
    |input: String| {
        aux_functions::verify_web3_id_credential_signature_aux(parse_input(&input)?)
            .map_err(operation_error)
    }
);
proof!(verify_presentation, String, |input| {
    presentation::verify_presentation(input).map_err(operation_error)
});
proof!(create_presentation_v1, String, |input| {
    presentation::create_presentation_v1(input).map_err(operation_error)
});
proof!(verify_presentation_v1, String, |input| {
    presentation::verify_presentation_v1(input).map_err(operation_error)
});
proof!(create_verification_request_v1_anchor, Vec<u8>, |input| {
    presentation::create_verification_request_v1_anchor(input).map_err(operation_error)
});
proof!(
    compute_verification_request_v1_anchor_hash,
    Vec<u8>,
    |input| presentation::compute_verification_request_v1_anchor_hash(input)
        .map_err(operation_error)
);
proof!(create_verification_audit_v1_anchor, Vec<u8>, |input| {
    presentation::create_verification_audit_v1_anchor(input).map_err(operation_error)
});
proof!(
    compute_verification_audit_v1_anchor_hash,
    Vec<u8>,
    |input| presentation::compute_verification_audit_v1_anchor_hash(input).map_err(operation_error)
);

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerifyIdProofInput {
    #[serde(deserialize_with = "concordium_base::common::base16_decode")]
    credential: concordium_base::id::constants::ArCurve,
    statement: concordium_base::id::id_proof_types::Statement<
        concordium_base::id::constants::ArCurve,
        concordium_base::id::constants::AttributeKind,
    >,
    global_context:
        concordium_base::id::types::GlobalContext<concordium_base::id::constants::ArCurve>,
    challenge: String,
    commitments: concordium_base::id::types::CredentialDeploymentCommitments<
        concordium_base::id::constants::ArCurve,
    >,
    proof: concordium_base::common::Versioned<
        concordium_base::id::id_proof_types::Proof<
            concordium_base::id::constants::ArCurve,
            concordium_base::id::constants::AttributeKind,
        >,
    >,
}

proof!(verify_id_proof, bool, |input: String| {
    use concordium_base::{
        common::VERSION_0,
        id::id_proof_types::{ProofVersion, StatementWithContext},
    };
    let input: VerifyIdProofInput = parse_input(&input)?;
    let challenge = hex::decode(input.challenge)
        .map_err(|_| IdentityError::InvalidInput("expected a hex challenge".into()))?;
    if input.proof.version != VERSION_0 {
        return Err(IdentityError::InvalidInput(
            "unsupported identity proof version".into(),
        ));
    }
    let statement = StatementWithContext {
        credential: input.credential,
        statement: input.statement,
    };
    Ok(statement.verify(
        ProofVersion::Version1,
        &challenge,
        &input.global_context,
        &input.commitments,
        &input.proof.value,
    ))
});
