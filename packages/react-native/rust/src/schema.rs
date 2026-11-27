use super::{on_worker, IdentityError};
use concordium_rust_bindings_dapp::aux_functions::*;

#[derive(uniffi::Record)]
pub struct ModuleSchema {
    pub bytes: Vec<u8>,
    pub contract_name: String,
    pub version: Option<u8>,
}

macro_rules! schema_operation {
    ($name:ident ($($arg:ident: $ty:ty),*) -> $result:ty => $call:expr) => {
        #[uniffi::export]
        pub async fn $name($($arg: $ty),*) -> Result<$result, IdentityError> {
            on_worker(move || {
                $call.map_err(|e| IdentityError::SchemaFailed(e.to_string()))
            }).await
        }
    }
}

fn decode_result(result: anyhow::Result<String>) -> anyhow::Result<Vec<u8>> {
    Ok(hex::decode(result?)?)
}

schema_operation!(get_init_contract_parameter_schema(schema: ModuleSchema) -> Vec<u8> =>
    decode_result(get_init_contract_parameter_schema_aux(hex::encode(schema.bytes), &schema.contract_name, schema.version)));
schema_operation!(get_receive_contract_parameter_schema(schema: ModuleSchema, entrypoint: String) -> Vec<u8> =>
    decode_result(get_receive_contract_parameter_schema_aux(hex::encode(schema.bytes), &schema.contract_name, &entrypoint, schema.version)));
schema_operation!(serialize_init_contract_parameters(schema: ModuleSchema, value: String, verbose: bool) -> Vec<u8> =>
    decode_result(serialize_init_contract_parameters_aux(value, hex::encode(schema.bytes), &schema.contract_name, schema.version, verbose)));
schema_operation!(serialize_receive_contract_parameters(schema: ModuleSchema, entrypoint: String, value: String, verbose: bool) -> Vec<u8> =>
    decode_result(serialize_receive_contract_parameters_aux(value, hex::encode(schema.bytes), &schema.contract_name, &entrypoint, schema.version, verbose)));
schema_operation!(serialize_type_value(schema: Vec<u8>, value: String, verbose: bool) -> Vec<u8> =>
    decode_result(serialize_type_value_aux(value, hex::encode(schema), verbose)));
schema_operation!(deserialize_type_value(schema: Vec<u8>, value: Vec<u8>, verbose: bool) -> String =>
    deserialize_type_value_aux(hex::encode(value), hex::encode(schema), verbose));
schema_operation!(display_type_schema_template(schema: Vec<u8>) -> String =>
    display_type_schema_template_aux(hex::encode(schema)));
schema_operation!(deserialize_state(schema: ModuleSchema, value: Vec<u8>, verbose: bool) -> String =>
    deserialize_state_aux(&schema.contract_name, hex::encode(value), hex::encode(schema.bytes), verbose));
schema_operation!(deserialize_receive_return_value(schema: ModuleSchema, entrypoint: String, value: Vec<u8>, verbose: bool) -> String =>
    deserialize_receive_return_value_aux(hex::encode(value), hex::encode(schema.bytes), &schema.contract_name, &entrypoint, schema.version, verbose));
schema_operation!(deserialize_init_error(schema: ModuleSchema, value: Vec<u8>, verbose: bool) -> String =>
    deserialize_init_error_aux(hex::encode(value), hex::encode(schema.bytes), &schema.contract_name, verbose));
schema_operation!(deserialize_receive_error(schema: ModuleSchema, entrypoint: String, value: Vec<u8>, verbose: bool) -> String =>
    deserialize_receive_error_aux(hex::encode(value), hex::encode(schema.bytes), &schema.contract_name, &entrypoint, verbose));

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn u64_schema_round_trip_preserves_all_bytes() {
        let schema = vec![5]; // U64
        let value = "18446744073709551615";
        let bytes = decode_result(serialize_type_value_aux(
            value.into(),
            hex::encode(&schema),
            false,
        ))
        .unwrap();
        assert_eq!(bytes, vec![255; 8]);
        assert_eq!(
            deserialize_type_value_aux(hex::encode(bytes), hex::encode(&schema), false).unwrap(),
            value
        );
        assert!(serialize_type_value_aux(
            "18446744073709551616".into(),
            hex::encode(schema),
            false
        )
        .is_err());
    }
}
