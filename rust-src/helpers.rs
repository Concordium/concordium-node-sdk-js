use anyhow::{anyhow, Result};
use crypto_common::types::KeyIndex;
use ed25519_dalek as ed25519;
use hex::FromHex;
use id::types::*;
use serde_json::{from_value, Value as SerdeValue};
use std::collections::BTreeMap;
use std::convert::TryInto;

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
