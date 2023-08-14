use anyhow::{anyhow, Result};
use concordium_base::contracts_common::{
    from_bytes,
    schema::{ModuleV0, Type, VersionedModuleSchema},
    Cursor,
};
use concordium_rust_bindings_common::types::{HexString, JsonString};
use hex;
use serde_json::{to_string, Value as SerdeValue};

/// Given the bytes of a contract's state, deserialize them to a json object,
/// using the provided schema. Both the state bytes and the schema are given as
/// hex-encoded strings.
pub fn deserialize_state_aux(
    contract_name: &str,
    state_bytes: HexString,
    schema: HexString,
    verbose_error_message: bool,
) -> Result<JsonString> {
    let module_schema: ModuleV0 = match from_bytes(&hex::decode(schema)?) {
        Ok(o) => o,
        Err(e) => return Err(anyhow!("unable to parse schema: {:#?}", e)),
    };
    let contract_schema = module_schema
        .contracts
        .get(contract_name)
        .ok_or_else(|| anyhow!("Unable to get contract schema: not included in module schema"))?;
    let state_schema = contract_schema
        .state
        .as_ref()
        .ok_or_else(|| anyhow!("Unable to get state schema: not included in contract schema"))?;

    deserialize_type_value(state_bytes, state_schema, verbose_error_message)
}

/// Given the bytes of a receive function's return value, deserialize them to a
/// json object, using the provided schema.
pub fn deserialize_receive_return_value_aux(
    return_value_bytes: HexString,
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
    verbose_error_message: bool,
) -> Result<JsonString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &schema_version)?;
    let return_value_schema =
        module_schema.get_receive_return_value_schema(contract_name, function_name)?;

    deserialize_type_value(
        return_value_bytes,
        &return_value_schema,
        verbose_error_message,
    )
}

/// Given the bytes of a receive function's error, deserialize them to a json
/// object, using the provided schema.
pub fn deserialize_receive_error_aux(
    error_bytes: HexString,
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    verbose_error_message: bool,
) -> Result<JsonString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &None)?;
    let error_schema = module_schema.get_receive_error_schema(contract_name, function_name)?;

    deserialize_type_value(error_bytes, &error_schema, verbose_error_message)
}

/// Given the bytes of an init function's error, deserialize them to a json
/// object, using the provided schema.
pub fn deserialize_init_error_aux(
    error_bytes: HexString,
    schema: HexString,
    contract_name: &str,
    verbose_error_message: bool,
) -> Result<JsonString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &None)?;
    let error_schema = module_schema.get_init_error_schema(contract_name)?;

    deserialize_type_value(error_bytes, &error_schema, verbose_error_message)
}

/// Given parameters to a receive function as a stringified json, serialize them
/// using the provided schema.
pub fn serialize_receive_contract_parameters_aux(
    parameters: JsonString,
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
    verbose_error_message: bool,
) -> Result<HexString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &schema_version)?;
    let parameter_type = module_schema.get_receive_param_schema(contract_name, function_name)?;
    let value: SerdeValue = serde_json::from_str(&parameters)?;

    let buf = parameter_type
        .serial_value(&value)
        .map_err(|e| anyhow!("{}", e.display(verbose_error_message)))?;

    Ok(hex::encode(buf))
}

/// Given parameters to an init function as a stringified json, serialize them
/// using the provided schema.
pub fn serialize_init_contract_parameters_aux(
    parameters: JsonString,
    schema: HexString,
    contract_name: &str,
    schema_version: Option<u8>,
    verbose_error_message: bool,
) -> Result<HexString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &schema_version)?;
    let parameter_type = module_schema.get_init_param_schema(contract_name)?;
    let value: SerdeValue = serde_json::from_str(&parameters)?;

    let buf = parameter_type
        .serial_value(&value)
        .map_err(|e| anyhow!("{}", e.display(verbose_error_message)))?;

    Ok(hex::encode(buf))
}

pub fn get_receive_contract_parameter_schema_aux(
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
) -> Result<HexString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &schema_version)?;
    let parameter_type = module_schema.get_receive_param_schema(contract_name, function_name)?;
    Ok(hex::encode(concordium_base::contracts_common::to_bytes(
        &parameter_type,
    )))
}

pub fn get_init_contract_parameter_schema_aux(
    schema: HexString,
    contract_name: &str,
    schema_version: Option<u8>,
) -> Result<HexString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &schema_version)?;
    let parameter_type = module_schema.get_init_param_schema(contract_name)?;
    Ok(hex::encode(concordium_base::contracts_common::to_bytes(
        &parameter_type,
    )))
}

pub fn serialize_type_value_aux(
    parameters: JsonString,
    schema: HexString,
    verbose_error_message: bool,
) -> Result<HexString> {
    let parameter_type: Type = from_bytes(&hex::decode(schema)?)?;
    serialize_type_value(parameters, parameter_type, verbose_error_message)
}

fn serialize_type_value(
    raw_value: JsonString,
    value_type: Type,
    verbose_error_message: bool,
) -> Result<HexString> {
    let value: SerdeValue = serde_json::from_str(&raw_value)?;

    let buf = value_type
        .serial_value(&value)
        .map_err(|e| anyhow!("{}", e.display(verbose_error_message)))?;
    Ok(hex::encode(buf))
}

pub fn deserialize_type_value_aux(
    serialized_value: HexString,
    schema: HexString,
    verbose_error_message: bool,
) -> Result<JsonString> {
    let value_type: Type = from_bytes(&hex::decode(schema)?)?;
    deserialize_type_value(serialized_value, &value_type, verbose_error_message)
}

fn deserialize_type_value(
    serialized_value: HexString,
    value_type: &Type,
    verbose_error_message: bool,
) -> Result<JsonString> {
    let mut cursor = Cursor::new(hex::decode(serialized_value)?);
    match value_type.to_json(&mut cursor) {
        Ok(v) => Ok(to_string(&v)?),
        Err(e) => Err(anyhow!("{}", e.display(verbose_error_message))),
    }
}

pub fn display_type_schema_template_aux(schema: HexString) -> Result<JsonString> {
    let value_type: Type = from_bytes(&hex::decode(schema)?)?;
    let v = value_type.to_json_template();
    Ok(to_string(&v)?)
}
