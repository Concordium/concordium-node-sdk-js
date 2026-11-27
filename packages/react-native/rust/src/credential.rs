use super::{on_worker, parse_input, IdentityError};
use concordium_rust_bindings_wallet::aux_functions::*;
use wallet_library::credential::create_unsigned_credential_v1_aux;

#[uniffi::export]
pub async fn generate_unsigned_credential(input: String) -> Result<String, IdentityError> {
    on_worker(move || {
        generate_unsigned_credential_aux(&input).map_err(|_| IdentityError::OperationFailed)
    })
    .await
}

#[uniffi::export]
pub async fn create_unsigned_credential_v1(input: String) -> Result<String, IdentityError> {
    on_worker(move || {
        create_unsigned_credential_v1_aux(parse_input(&input)?)
            .map_err(|_| IdentityError::OperationFailed)
    })
    .await
}

#[uniffi::export]
pub async fn get_deployment_details(
    signatures: Vec<String>,
    unsigned_info: String,
    expiry: u64,
) -> Result<String, IdentityError> {
    on_worker(move || {
        get_credential_deployment_details_aux(signatures, &unsigned_info, expiry)
            .map_err(|_| IdentityError::OperationFailed)
    })
    .await
}

#[uniffi::export]
pub async fn get_deployment_info(
    signatures: Vec<String>,
    unsigned_info: String,
) -> Result<String, IdentityError> {
    on_worker(move || {
        get_credential_deployment_info_aux(signatures, &unsigned_info)
            .map_err(|_| IdentityError::OperationFailed)
    })
    .await
}

#[uniffi::export]
pub async fn serialize_credential_deployment_payload(
    signatures: Vec<String>,
    unsigned_info: String,
) -> Result<Vec<u8>, IdentityError> {
    on_worker(move || {
        serialize_credential_deployment_payload_aux(signatures, &unsigned_info)
            .map_err(|_| IdentityError::OperationFailed)
    })
    .await
}

#[uniffi::export]
pub async fn deserialize_credential_deployment(bytes: Vec<u8>) -> Result<String, IdentityError> {
    on_worker(move || {
        deserialize_credential_deployment_bytes(&bytes).map_err(|_| IdentityError::OperationFailed)
    })
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{json, Value};

    #[test]
    fn v1_credential_matches_the_sdk_fixture_and_round_trips() {
        let mut input: Value = serde_json::from_str(include_str!(
            "../../../sdk/test/ci/resources/credential-input-no-seed.json"
        ))
        .unwrap();
        input["blindingRandomness"] = input["sigRetrievelRandomness"].take();

        let result =
            create_unsigned_credential_v1_aux(parse_input(&input.to_string()).unwrap()).unwrap();
        let result: Value = serde_json::from_str(&result).unwrap();
        let unsigned = &result["unsignedCdi"];
        let credential_id = "930e1e148d2a08b14ed3b5569d4768c96dbea5f540822ee38a6c52ca6c172be408ca4b78d6e2956cfad157bd02804c2c";
        assert_eq!(unsigned["credId"], credential_id);

        let unsigned = unsigned.to_string();
        let signatures = vec!["00".repeat(64)];
        let expiry = u64::MAX;
        let details =
            get_credential_deployment_details_aux(signatures.clone(), &unsigned, expiry).unwrap();
        let details: Value = serde_json::from_str(&details).unwrap();
        let serialized = hex::decode(details["serializedTransaction"].as_str().unwrap()).unwrap();
        let payload = serialize_credential_deployment_payload_aux(signatures, &unsigned).unwrap();
        assert_eq!(payload, serialized[10..]);
        let decoded = deserialize_credential_deployment_bytes(&serialized[2..]).unwrap();
        let decoded: Value = serde_json::from_str(&decoded).unwrap();
        assert_eq!(decoded["credential"]["contents"]["credId"], credential_id);
        assert_eq!(decoded["messageExpiry"], json!(expiry));

        input["address"] = json!("4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf");
        let existing =
            create_unsigned_credential_v1_aux(parse_input(&input.to_string()).unwrap()).unwrap();
        let existing: Value = serde_json::from_str(&existing).unwrap();
        assert_eq!(existing["unsignedCdi"]["credId"], credential_id);
        assert!(get_credential_deployment_info_aux(vec!["invalid".into()], &unsigned).is_err());
    }
}
