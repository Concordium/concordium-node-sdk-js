use crate::aux_functions::*;
use concordium_rust_bindings_common::{
    helpers::{to_js_error, JsResult},
    types::{HexString, JsonString},
};
use wasm_bindgen::prelude::*;

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
