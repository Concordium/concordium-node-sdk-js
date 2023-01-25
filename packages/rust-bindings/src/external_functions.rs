use crate::aux_functions::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = generateUnsignedCredential)]
pub fn generate_unsigned_credential_ext(input: &str) -> String {
    match generate_unsigned_credential_aux(input) {
        Ok(s) => s,
        Err(e) => format!("Unable to generate an unsigned credential due to: {}", e),
    }
}

// Will be deprecated after GRPCv1 is deprecated
#[wasm_bindgen(js_name = getDeploymentDetails)]
pub fn get_credential_deployment_details_ext(
    signatures: &JsValue,
    unsigned_info: &str,
    expiry: u64,
) -> String {
    let signatures_vec: Vec<String> = signatures.into_serde().unwrap();
    match get_credential_deployment_details_aux(signatures_vec, unsigned_info, expiry) {
        Ok(s) => s,
        Err(e) => format!("Unable to get credential deployment details due to: {}", e),
    }
}

#[wasm_bindgen(js_name = getDeploymentInfo)]
pub fn get_credential_deployment_info_ext(signatures: &JsValue, unsigned_info: &str) -> String {
    let signatures_vec: Vec<String> = signatures.into_serde().unwrap();
    match get_credential_deployment_info_aux(signatures_vec, unsigned_info) {
        Ok(s) => s,
        Err(e) => format!("unable to get credential due to: {}", e),
    }
}

#[wasm_bindgen(js_name = deserializeState)]
pub fn deserialize_state(contract_name: &str, state_bytes: String, schema: String) -> String {
    match deserialize_state_aux(contract_name, state_bytes, schema) {
        Ok(s) => s,
        Err(e) => format!("{}", e),
    }
}

#[wasm_bindgen(js_name = deserializeCredentialDeployment)]
pub fn deserialize_credential_deployment_ext(serialized: &str) -> String {
    match deserialize_credential_deployment_aux(serialized) {
        Ok(s) => s,
        Err(e) => format!("{}", e),
    }
}

#[wasm_bindgen(js_name = deserializeReceiveReturnValue)]
pub fn deserialize_receive_return_value(
    return_value_bytes: String,
    module_schema: String,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
) -> String {
    match deserialize_receive_return_value_aux(
        return_value_bytes,
        module_schema,
        contract_name,
        function_name,
        schema_version,
    ) {
        Ok(s) => s,
        Err(e) => format!("{}", e),
    }
}

#[wasm_bindgen(js_name = deserializeReceiveError)]
pub fn deserialize_receive_error(
    error_bytes: HexString,
    schema: HexString,
    contract_name: &str,
    function_name: &str,
) -> JsonString {
    match deserialize_receive_error_aux(error_bytes, schema, contract_name, function_name) {
        Ok(s) => s,
        Err(e) => format!("{}", e),
    }
}

#[wasm_bindgen(js_name = deserializeInitError)]
pub fn deserialize_init_error(
    error_bytes: HexString,
    schema: HexString,
    contract_name: &str,
) -> JsonString {
    match deserialize_init_error_aux(error_bytes, schema, contract_name) {
        Ok(s) => s,
        Err(e) => format!("{}", e),
    }
}

#[wasm_bindgen(js_name = serializeReceiveContractParameters)]
pub fn serialize_receive_contract_parameters(
    parameters: JsonString,
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
) -> String {
    match serialize_receive_contract_parameters_aux(
        parameters,
        schema,
        contract_name,
        function_name,
        schema_version,
    ) {
        Ok(s) => s,
        Err(e) => format!("{}", e),
    }
}

#[wasm_bindgen(js_name = serializeInitContractParameters)]
pub fn serialize_init_contract_parameters(
    parameters: JsonString,
    schema: HexString,
    contract_name: &str,
    schema_version: Option<u8>,
) -> String {
    match serialize_init_contract_parameters_aux(parameters, schema, contract_name, schema_version)
    {
        Ok(s) => s,
        Err(e) => format!("{}", e),
    }
}

#[wasm_bindgen(js_name = getReceiveContractParameterSchema)]
pub fn get_receive_contract_parameter_schema_ext(
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
) -> String {
    error_to_string(get_receive_contract_parameter_schema_aux(
        schema,
        contract_name,
        function_name,
        schema_version,
    ))
}

#[wasm_bindgen(js_name = getInitContractParameterSchema)]
pub fn get_init_contract_parameter_schema_ext(
    schema: HexString,
    contract_name: &str,
    schema_version: Option<u8>,
) -> String {
    error_to_string(get_init_contract_parameter_schema_aux(
        schema,
        contract_name,
        schema_version,
    ))
}

#[wasm_bindgen(js_name = serializeTypeValue)]
pub fn serialize_type_value_ext(value: JsonString, value_type: HexString) -> String {
    error_to_string(serialize_type_value_aux(value, value_type))
}

#[wasm_bindgen(js_name = createIdRequestV1)]
pub fn create_id_request_v1_ext(input: &str) -> String {
    match create_id_request_v1_aux(serde_json::from_str(input).unwrap()) {
        Ok(s) => s,
        Err(e) => format!("{}", e),
    }
}

#[wasm_bindgen(js_name = createIdentityRecoveryRequest)]
pub fn create_identity_recovery_request_ext(input: &str) -> String {
    error_to_string(create_identity_recovery_request_aux(
        serde_json::from_str(input).unwrap(),
    ))
}

#[wasm_bindgen(js_name = createCredentialV1)]
pub fn create_credential_v1_ext(raw_input: &str) -> String {
    match serde_json::from_str(raw_input) {
        Ok(input) => match create_credential_v1_aux(input) {
            Ok(s) => s,
            Err(e) => format!("{}", e),
        },
        Err(e) => format!("{}", e),
    }
}

#[wasm_bindgen(js_name = createIdProof)]
pub fn create_id_proof_ext(raw_input: &str) -> String {
    match serde_json::from_str(raw_input) {
        Ok(input) => match create_id_proof_aux(input) {
            Ok(s) => s,
            Err(e) => format!("{}", e),
        },
        Err(e) => format!("{}", e),
    }
}

#[wasm_bindgen(js_name = getAccountSigningKey)]
pub fn get_account_signing_key_ext(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u32,
) -> String {
    error_to_string(get_account_signing_key_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
        credential_counter,
    ))
}

#[wasm_bindgen(js_name = getAccountPublicKey)]
pub fn get_account_public_key_ext(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u32,
) -> String {
    error_to_string(get_account_public_key_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
        credential_counter,
    ))
}

#[wasm_bindgen(js_name = getCredentialId)]
pub fn get_credential_id_ext(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u8,
    raw_on_chain_commitment_key: &str,
) -> String {
    error_to_string(get_credential_id_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
        credential_counter,
        raw_on_chain_commitment_key,
    ))
}

#[wasm_bindgen(js_name = getPrfKey)]
pub fn get_prf_key_ext(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
) -> String {
    error_to_string(get_prf_key_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
    ))
}

#[wasm_bindgen(js_name = getIdCredSec)]
pub fn get_id_cred_sec_ext(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
) -> String {
    error_to_string(get_id_cred_sec_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
    ))
}

#[wasm_bindgen(js_name = getSignatureBlindingRandomness)]
pub fn get_signature_blinding_randomness_ext(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
) -> String {
    error_to_string(get_signature_blinding_randomness_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
    ))
}

#[wasm_bindgen(js_name = getAttributeCommitmentRandomness)]
pub fn get_attribute_commitment_randomness_ext(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u32,
    attribute: u8,
) -> String {
    error_to_string(get_attribute_commitment_randomness_aux(
        seed_as_hex,
        raw_net,
        identity_provider_index,
        identity_index,
        credential_counter,
        attribute,
    ))
}

#[wasm_bindgen(js_name = serializeCredentialDeploymentPayload)]
pub fn serialize_credential_deployment_payload_ext(
    signatures: &JsValue,
    unsigned_info: &str,
) -> Result<Vec<u8>, String> {
    let signatures_vec: Vec<HexString> = signatures.into_serde().unwrap();
    serialize_credential_deployment_payload_aux(signatures_vec, unsigned_info)
        .map_err(|e| format!("Unable to get credential deployment payload due to: {}", e))
}
