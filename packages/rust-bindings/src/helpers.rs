use anyhow::{anyhow, Result};
use concordium_contracts_common::{from_bytes, schema::VersionedModuleSchema};
use crypto_common::types::KeyIndex;
use ed25519_dalek as ed25519;
use hex::FromHex;
use id::types::*;
use serde_json::{from_value, Value as SerdeValue};
use std::{collections::BTreeMap, convert::TryInto};

pub fn build_key_map(keys: &[VerifyKey]) -> BTreeMap<KeyIndex, VerifyKey> {
    keys.iter()
        .enumerate()
        .map(|(index, key)| (KeyIndex(index.try_into().unwrap()), key.clone()))
        .collect()
}

pub fn build_signature_map(signatures: &[String]) -> BTreeMap<KeyIndex, AccountOwnershipSignature> {
    signatures
        .iter()
        .enumerate()
        .map(|(index, key)| {
            (
                KeyIndex(index.try_into().unwrap()),
                AccountOwnershipSignature::from(ed25519::Signature::new(
                    <[u8; 64]>::from_hex(key).unwrap(),
                )),
            )
        })
        .collect()
}

/// Try to extract a field with a given name from the JSON value.
pub fn try_get<A: serde::de::DeserializeOwned>(v: &SerdeValue, fname: &str) -> Result<A> {
    match v.get(fname) {
        Some(v) => Ok(from_value(v.clone())?),
        None => Err(anyhow!("Field {} not present, but should be.", fname)),
    }
}

/// Get a versioned module schema. First reads header to see if the version can
/// be discerned, otherwise tries using provided schema_version.
pub fn get_versioned_schema(
    schema_bytes: &[u8],
    schema_version: Option<u8>,
) -> Result<VersionedModuleSchema> {
    let module_schema = match from_bytes::<VersionedModuleSchema>(schema_bytes) {
        Ok(versioned) => versioned,
        Err(_) => match schema_version {
            Some(0) => VersionedModuleSchema::V0(from_bytes(schema_bytes)?),
            Some(1) => VersionedModuleSchema::V1(from_bytes(schema_bytes)?),
            Some(2) => VersionedModuleSchema::V2(from_bytes(schema_bytes)?),
            Some(_) => return Err(anyhow!("Invalid schema version")),
            None => return Err(anyhow!("Missing schema version")),
        },
    };
    Ok(module_schema)
}
