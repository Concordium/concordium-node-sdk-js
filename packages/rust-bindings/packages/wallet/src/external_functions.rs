use crate::aux_functions::*;
use anyhow::Context;
use concordium_base::{
    self as base,
    id::{
        constants::{ArCurve, IpPairing},
        types::GlobalContext,
    },
    web3id::{
        v1::{CredentialVerificationMaterial, PresentationV1},
        CredentialsInputs, Presentation, Web3IdAttribute,
    },
};
use concordium_rust_bindings_common::{
    helpers::{to_js_error, JsResult},
    types::{Base58String, HexString, JsonString},
};
use wallet_library::{
    credential::create_unsigned_credential_v1_aux,
    identity::{create_identity_object_request_v1_aux, create_identity_recovery_request_aux},
    wallet::{
        get_account_public_key_aux, get_account_signing_key_aux,
        get_attribute_commitment_randomness_aux, get_credential_id_aux, get_id_cred_sec_aux,
        get_prf_key_aux, get_signature_blinding_randomness_aux,
        get_verifiable_credential_backup_encryption_key_aux,
        get_verifiable_credential_public_key_aux, get_verifiable_credential_signing_key_aux,
    },
};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = generateUnsignedCredential)]
pub fn generate_unsigned_credential_ext(input: &str) -> JsResult {
    generate_unsigned_credential_aux(input).map_err(|e| {
        JsError::new(&format!(
            "Unable to generate an unsigned credential due to: {}",
            e
        ))
    })
}

// Will be deprecated after GRPCv1 is deprecated
#[wasm_bindgen(js_name = getDeploymentDetails)]
pub fn get_credential_deployment_details_ext(
    signatures: &JsValue,
    unsigned_info: &str,
    expiry: u64,
) -> JsResult {
    let signatures_vec: Vec<HexString> =
        serde_wasm_bindgen::from_value(signatures.clone()).unwrap();
    get_credential_deployment_details_aux(signatures_vec, unsigned_info, expiry).map_err(|e| {
        JsError::new(&format!(
            "Unable to get credential deployment details due to: {}",
            e
        ))
    })
}

#[wasm_bindgen(js_name = getDeploymentInfo)]
pub fn get_credential_deployment_info_ext(signatures: &JsValue, unsigned_info: &str) -> JsResult {
    let signatures_vec: Vec<HexString> =
        serde_wasm_bindgen::from_value(signatures.clone()).unwrap();
    get_credential_deployment_info_aux(signatures_vec, unsigned_info)
        .map_err(|e| JsError::new(&format!("Unable to get credential due to: {}", e)))
}

#[wasm_bindgen(js_name = createIdRequestV1)]
pub fn create_id_request_v1_ext(input: JsonString) -> JsResult {
    create_identity_object_request_v1_aux(serde_json::from_str(&input).unwrap())
        .map_err(to_js_error)
}

#[wasm_bindgen(js_name = createIdentityRecoveryRequest)]
pub fn create_identity_recovery_request_ext(input: JsonString) -> JsResult {
    create_identity_recovery_request_aux(serde_json::from_str(&input).unwrap()).map_err(to_js_error)
}

#[wasm_bindgen(js_name = createCredentialV1)]
pub fn create_credential_v1_ext(raw_input: JsonString) -> JsResult {
    let input = serde_json::from_str(&raw_input)?;
    create_credential_v1_aux(input).map_err(to_js_error)
}

#[wasm_bindgen(js_name = createUnsignedCredentialV1)]
pub fn create_unsigned_credential_v1_ext(input: JsonString) -> JsResult {
    create_unsigned_credential_v1_aux(serde_json::from_str(&input).unwrap()).map_err(to_js_error)
}

#[wasm_bindgen(js_name = createIdProof)]
pub fn create_id_proof_ext(raw_input: JsonString) -> JsResult {
    let input = serde_json::from_str(&raw_input)?;
    create_id_proof_aux(input).map_err(to_js_error)
}

#[wasm_bindgen(js_name = getAccountSigningKey)]
pub fn get_account_signing_key_ext(
    seed_as_hex: HexString,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u32,
) -> JsResult<HexString> {
    get_account_signing_key_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
        credential_counter,
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = getAccountPublicKey)]
pub fn get_account_public_key_ext(
    seed_as_hex: HexString,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u32,
) -> JsResult<HexString> {
    get_account_public_key_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
        credential_counter,
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = deserializeCredentialDeployment)]
pub fn deserialize_credential_deployment_ext(serialized: JsonString) -> JsResult {
    deserialize_credential_deployment_aux(&serialized).map_err(to_js_error)
}

#[wasm_bindgen(js_name = getCredentialId)]
pub fn get_credential_id_ext(
    seed_as_hex: HexString,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u8,
    raw_on_chain_commitment_key: &str,
) -> JsResult<HexString> {
    get_credential_id_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
        credential_counter,
        raw_on_chain_commitment_key,
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = getPrfKey)]
pub fn get_prf_key_ext(
    seed_as_hex: HexString,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
) -> JsResult<HexString> {
    get_prf_key_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = getIdCredSec)]
pub fn get_id_cred_sec_ext(
    seed_as_hex: HexString,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
) -> JsResult<HexString> {
    get_id_cred_sec_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = getSignatureBlindingRandomness)]
pub fn get_signature_blinding_randomness_ext(
    seed_as_hex: HexString,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
) -> JsResult<HexString> {
    get_signature_blinding_randomness_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = getAttributeCommitmentRandomness)]
pub fn get_attribute_commitment_randomness_ext(
    seed_as_hex: HexString,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u32,
    attribute: u8,
) -> JsResult<HexString> {
    get_attribute_commitment_randomness_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
        credential_counter,
        attribute,
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = getVerifiableCredentialSigningKey)]
pub fn get_verifiable_credential_signing_key_ext(
    seed_as_hex: HexString,
    raw_net: &str,
    issuer_index: u64,
    issuer_subindex: u64,
    verifiable_credential_index: u32,
) -> JsResult<HexString> {
    get_verifiable_credential_signing_key_aux(
        seed_as_hex,
        raw_net,
        issuer_index,
        issuer_subindex,
        verifiable_credential_index,
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = getVerifiableCredentialPublicKey)]
pub fn get_verifiable_credential_public_key_ext(
    seed_as_hex: HexString,
    raw_net: &str,
    issuer_index: u64,
    issuer_subindex: u64,
    verifiable_credential_index: u32,
) -> JsResult<HexString> {
    get_verifiable_credential_public_key_aux(
        seed_as_hex,
        raw_net,
        issuer_index,
        issuer_subindex,
        verifiable_credential_index,
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = getVerifiableCredentialBackupEncryptionKey)]
pub fn get_verifiable_credential_backup_encryption_key_ext(
    seed_as_hex: HexString,
    raw_net: &str,
) -> JsResult<HexString> {
    get_verifiable_credential_backup_encryption_key_aux(seed_as_hex, raw_net).map_err(to_js_error)
}

#[wasm_bindgen(js_name = serializeCredentialDeploymentPayload)]
pub fn serialize_credential_deployment_payload_ext(
    signatures: &JsValue,
    unsigned_info: &str,
) -> JsResult<Vec<u8>> {
    let signatures_vec: Vec<HexString> =
        serde_wasm_bindgen::from_value(signatures.clone()).unwrap();
    serialize_credential_deployment_payload_aux(signatures_vec, unsigned_info).map_err(|e| {
        JsError::new(&format!(
            "Unable to get credential deployment payload due to: {}",
            e
        ))
    })
}

#[wasm_bindgen(js_name = generateBakerKeys)]
pub fn generate_baker_keys_ext(sender: Base58String) -> JsResult {
    let sender = sender
        .parse()
        .map_err(|e| JsError::new(&format!("Unable to parse sender account address: {}", e)))?;
    generate_baker_keys(sender).map_err(to_js_error)
}

#[wasm_bindgen(js_name = createWeb3IdProof)]
pub fn create_web3_id_proof_ext(raw_input: JsonString) -> JsResult {
    let input = serde_json::from_str(&raw_input)?;
    create_web3_id_proof_aux(input).map_err(to_js_error)
}

#[wasm_bindgen(js_name = verifyWeb3IdCredentialSignature)]
pub fn verify_web3_id_credential_signature_ext(raw_input: JsonString) -> JsResult<bool> {
    let input = serde_json::from_str(&raw_input)?;
    verify_web3_id_credential_signature_aux(input).map_err(to_js_error)
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerifyPresentationInput {
    presentation: Presentation<ArCurve, Web3IdAttribute>,
    global_context: GlobalContext<ArCurve>,
    public_data: Vec<CredentialsInputs<ArCurve>>,
}

#[wasm_bindgen(js_name = verifyPresentation)]
pub fn verify_presentation(input: JsonString) -> JsResult {
    let input: VerifyPresentationInput = serde_json::from_str(&input).map_err(to_js_error)?;
    let request = input
        .presentation
        .verify(&input.global_context, input.public_data.iter())
        .map_err(to_js_error)?;
    let request = serde_json::to_string(&request)?;
    Ok(request)
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct PresentationV1Input {
    request: base::web3id::v1::RequestV1<ArCurve, Web3IdAttribute>,
    global: GlobalContext<ArCurve>,
    inputs: Vec<
        base::web3id::v1::OwnedCredentialProofPrivateInputs<IpPairing, ArCurve, Web3IdAttribute>,
    >,
}

#[wasm_bindgen(js_name = createPresentationV1)]
pub fn create_presentation_v1(raw_input: JsonString) -> JsResult {
    let PresentationV1Input {
        request,
        global,
        inputs,
    } = serde_json::from_str(&raw_input)?;
    let inputs = inputs.iter().map(|i| i.borrow());
    let presentation = request
        .prove(&global, inputs.into_iter())
        .map_err(to_js_error)?;

    serde_json::to_string(&presentation)
        .context("Failed to serialize PresentationV1")
        .map_err(to_js_error)
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerificationV1Input {
    presentation: PresentationV1<IpPairing, ArCurve, Web3IdAttribute>,
    global_context: GlobalContext<ArCurve>,
    public_data: Vec<CredentialVerificationMaterial<IpPairing, ArCurve>>,
}

#[wasm_bindgen(js_name = verifyPresentationV1)]
pub fn verify_presentation_v1(raw_input: JsonString) -> JsResult {
    let VerificationV1Input {
        public_data,
        global_context,
        presentation,
    } = serde_json::from_str(&raw_input)?;

    let request = presentation
        .verify(&global_context, public_data.iter())
        .map_err(to_js_error)?;
    serde_json::to_string(&request)
        .context("Failed to serialize RequestV1")
        .map_err(to_js_error)
}
