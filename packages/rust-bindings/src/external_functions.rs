use std::{cmp::Ordering, fmt::Display};

use crate::{aux_functions::*, types::*};
use wasm_bindgen::prelude::*;

type JsResult<T = JsonString> = Result<T, JsError>;

fn to_js_error(error: impl Display) -> JsError { JsError::new(&format!("{}", error)) }

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

#[wasm_bindgen(js_name = deserializeState)]
pub fn deserialize_state(
    contract_name: &str,
    state_bytes: HexString,
    schema: String,
    verbose_error_message: Option<bool>,
) -> JsResult {
    deserialize_state_aux(
        contract_name,
        state_bytes,
        schema,
        verbose_error_message.unwrap_or(false),
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = deserializeCredentialDeployment)]
pub fn deserialize_credential_deployment_ext(serialized: JsonString) -> JsResult {
    deserialize_credential_deployment_aux(&serialized).map_err(to_js_error)
}

#[wasm_bindgen(js_name = deserializeReceiveReturnValue)]
pub fn deserialize_receive_return_value(
    return_value_bytes: HexString,
    module_schema: HexString,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
    verbose_error_message: Option<bool>,
) -> JsResult {
    deserialize_receive_return_value_aux(
        return_value_bytes,
        module_schema,
        contract_name,
        function_name,
        schema_version,
        verbose_error_message.unwrap_or(false),
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = deserializeReceiveError)]
pub fn deserialize_receive_error(
    error_bytes: HexString,
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    verbose_error_message: Option<bool>,
) -> JsResult {
    deserialize_receive_error_aux(
        error_bytes,
        schema,
        contract_name,
        function_name,
        verbose_error_message.unwrap_or(false),
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = deserializeInitError)]
pub fn deserialize_init_error(
    error_bytes: HexString,
    schema: HexString,
    contract_name: &str,
    verbose_error_message: Option<bool>,
) -> JsResult {
    deserialize_init_error_aux(
        error_bytes,
        schema,
        contract_name,
        verbose_error_message.unwrap_or(false),
    )
    .map_err(to_js_error)
}

#[wasm_bindgen(js_name = serializeReceiveContractParameters)]
pub fn serialize_receive_contract_parameters(
    parameters: JsonString,
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
    verbose_error_message: Option<bool>,
) -> JsResult<HexString> {
    serialize_receive_contract_parameters_aux(
        parameters,
        schema,
        contract_name,
        function_name,
        schema_version,
        verbose_error_message.unwrap_or(false),
    )
    .map_err(|e| JsError::new(&format!("Unable to serialize parameters, due to: {}", e)))
}

#[wasm_bindgen(js_name = serializeInitContractParameters)]
pub fn serialize_init_contract_parameters(
    parameters: JsonString,
    schema: HexString,
    contract_name: &str,
    schema_version: Option<u8>,
    verbose_error_message: Option<bool>,
) -> JsResult<HexString> {
    serialize_init_contract_parameters_aux(
        parameters,
        schema,
        contract_name,
        schema_version,
        verbose_error_message.unwrap_or(false),
    )
    .map_err(|e| JsError::new(&format!("Unable to serialize parameters, due to: {}", e)))
}

#[wasm_bindgen(js_name = getReceiveContractParameterSchema)]
pub fn get_receive_contract_parameter_schema_ext(
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
) -> JsResult<HexString> {
    get_receive_contract_parameter_schema_aux(schema, contract_name, function_name, schema_version)
        .map_err(|e| JsError::new(&format!("Unable to get parameter schema, due to: {}", e)))
}

#[wasm_bindgen(js_name = getInitContractParameterSchema)]
pub fn get_init_contract_parameter_schema_ext(
    schema: HexString,
    contract_name: &str,
    schema_version: Option<u8>,
) -> JsResult<HexString> {
    get_init_contract_parameter_schema_aux(schema, contract_name, schema_version)
        .map_err(|e| JsError::new(&format!("unable to get parameter schema, due to: {}", e)))
}

#[wasm_bindgen(js_name = serializeTypeValue)]
pub fn serialize_type_value_ext(
    value: JsonString,
    schema: HexString,
    verbose_error_message: Option<bool>,
) -> JsResult<HexString> {
    serialize_type_value_aux(value, schema, verbose_error_message.unwrap_or(false))
        .map_err(|e| JsError::new(&format!("Unable to serialize value due to: {}", e)))
}

#[wasm_bindgen(js_name = createIdRequestV1)]
pub fn create_id_request_v1_ext(input: JsonString) -> JsResult {
    create_id_request_v1_aux(serde_json::from_str(&input).unwrap()).map_err(to_js_error)
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

#[wasm_bindgen(js_name = deserializeTypeValue)]
pub fn deserialize_type_value_ext(
    serialized_value: HexString,
    schema: HexString,
    verbose_error_message: Option<bool>,
) -> JsResult {
    deserialize_type_value_aux(
        serialized_value,
        schema,
        verbose_error_message.unwrap_or(false),
    )
    .map_err(|e| JsError::new(&format!("Unable to deserialize value due to: {}", e)))
}

#[wasm_bindgen(js_name = displayTypeSchemaTemplate)]
pub fn display_type_schema_template(schema: HexString) -> JsResult {
    display_type_schema_template_aux(schema)
        .map_err(|e| JsError::new(&format!("Unable to get template of schema: {}", e)))
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

#[wasm_bindgen(js_name = compareStringAttributes)]
pub fn compare_string_attributes_ext(attribute1: String, attribute2: String) -> i8 {
    match compare_string_attributes_aux(attribute1, attribute2) {
        Ordering::Less => -1,
        Ordering::Equal => 0,
        Ordering::Greater => 1,
    }
}
