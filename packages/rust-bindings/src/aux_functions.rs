use crate::{helpers::*, types::*};
use concordium_base::{
    common::{types::TransactionTime, *},
    contracts_common::{
        from_bytes,
        schema::{ModuleV0, Type, VersionedModuleSchema},
        Cursor,
    },
    id::dodis_yampolskiy_prf as prf,
    transactions::Payload,
};
use hex;
use key_derivation::{ConcordiumHdWallet, Net};
use serde::{Deserialize as SerdeDeserialize, Serialize as SerdeSerialize};
use serde_json::{from_str, Value as SerdeValue};
use std::{collections::BTreeMap, convert::TryInto};

pub type JsonString = String;
pub type HexString = String;

use anyhow::{anyhow, bail, ensure, Context, Result};
use concordium_base::{
    common::types::{KeyIndex, KeyPair},
    id::{
        account_holder::{
            create_credential, create_unsigned_credential, generate_id_recovery_request,
            generate_pio_v1,
        },
        constants,
        constants::{ArCurve, AttributeKind},
        id_proof_types::{Proof, Statement, StatementWithContext},
        pedersen_commitment::{
            CommitmentKey as PedersenKey, Randomness as PedersenRandomness, Value as PedersenValue,
            Value,
        },
        secret_sharing::Threshold,
        types::*,
    },
};
use ed25519_hd_key_derivation::DeriveError;
use either::Either::Left;
use serde_json::to_string;
use thiserror::Error;

#[derive(SerdeSerialize, SerdeDeserialize)]
pub struct CredId {
    #[serde(
        rename = "credId",
        serialize_with = "base16_encode",
        deserialize_with = "base16_decode"
    )]
    pub cred_id: constants::ArCurve,
}

#[derive(SerdeSerialize, SerdeDeserialize)]
#[serde(rename_all = "camelCase")]
pub struct IdRequestInput {
    ip_info:        IpInfo<constants::IpPairing>,
    global_context: GlobalContext<constants::ArCurve>,
    ars_infos:      BTreeMap<ArIdentity, ArInfo<constants::ArCurve>>,
    seed:           String,
    net:            String,
    identity_index: u32,
    ar_threshold:   u8,
}

pub fn error_to_string(result: Result<String>) -> String {
    match result {
        Ok(s) => s,
        Err(e) => format!("{}", e),
    }
}

fn get_net(net: &str) -> Result<Net> {
    Ok(match net {
        "Mainnet" => Net::Mainnet,
        "Testnet" => Net::Testnet,
        _ => bail!("Unknown net"),
    })
}

fn get_wallet(seed_as_hex: &str, raw_net: &str) -> anyhow::Result<ConcordiumHdWallet> {
    let seed_decoded = hex::decode(seed_as_hex)?;
    let seed: [u8; 64] = match seed_decoded.try_into() {
        Ok(s) => s,
        Err(_) => bail!("The provided seed {} was not 64 bytes", seed_as_hex),
    };

    let net = get_net(raw_net)?;
    let wallet = ConcordiumHdWallet { seed, net };
    Ok(wallet)
}

pub fn get_account_signing_key_aux(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u32,
) -> Result<String> {
    let wallet = get_wallet(seed_as_hex, raw_net)?;
    let key = wallet.get_account_signing_key(
        identity_provider_index,
        identity_index,
        credential_counter,
    )?;
    Ok(hex::encode(key.as_bytes()))
}

pub fn get_account_public_key_aux(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u32,
) -> Result<String> {
    let wallet = get_wallet(seed_as_hex, raw_net)?;
    let key = wallet.get_account_public_key(
        identity_provider_index,
        identity_index,
        credential_counter,
    )?;
    Ok(hex::encode(key.as_bytes()))
}

pub fn get_credential_id_aux(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u8,
    raw_on_chain_commitment_key: &str,
) -> Result<String> {
    let wallet = get_wallet(seed_as_hex, raw_net)?;
    let prf_key = wallet.get_prf_key(identity_provider_index, identity_index)?;

    let cred_id_exponent = prf_key.prf_exponent(credential_counter)?;
    let on_chain_commitment_key: PedersenKey<constants::ArCurve> =
        base16_decode_string(raw_on_chain_commitment_key)?;
    let cred_id = on_chain_commitment_key
        .hide(
            &Value::<constants::ArCurve>::new(cred_id_exponent),
            &PedersenRandomness::zero(),
        )
        .0;
    Ok(base16_encode_string(&cred_id))
}

pub fn get_prf_key_aux(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
) -> Result<String> {
    let wallet = get_wallet(seed_as_hex, raw_net)?;
    let key = wallet.get_prf_key(identity_provider_index, identity_index)?;
    Ok(hex::encode(to_bytes(&key)))
}

pub fn get_id_cred_sec_aux(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
) -> Result<String> {
    let wallet = get_wallet(seed_as_hex, raw_net)?;
    let key = wallet.get_id_cred_sec(identity_provider_index, identity_index)?;
    Ok(hex::encode(to_bytes(&key)))
}

pub fn get_signature_blinding_randomness_aux(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
) -> Result<String> {
    let wallet = get_wallet(seed_as_hex, raw_net)?;
    let key = wallet.get_blinding_randomness(identity_provider_index, identity_index)?;
    Ok(hex::encode(to_bytes(&key)))
}

pub fn get_attribute_commitment_randomness_aux(
    seed_as_hex: &str,
    raw_net: &str,
    identity_provider_index: u32,
    identity_index: u32,
    credential_counter: u32,
    attribute: u8,
) -> Result<String> {
    let wallet = get_wallet(seed_as_hex, raw_net)?;
    let key = wallet.get_attribute_commitment_randomness(
        identity_provider_index,
        identity_index,
        credential_counter,
        AttributeTag(attribute),
    )?;
    Ok(hex::encode(to_bytes(&key)))
}

pub fn create_id_request_v1_aux(input: IdRequestInput) -> Result<String> {
    let seed_decoded = hex::decode(&input.seed)?;
    let seed: [u8; 64] = match seed_decoded.try_into() {
        Ok(s) => s,
        Err(_) => bail!("The provided seed {} was not 64 bytes", input.seed),
    };
    let identity_provider_index = input.ip_info.ip_identity.0;

    let net = get_net(&input.net)?;
    let wallet = ConcordiumHdWallet { seed, net };

    let prf_key: prf::SecretKey<ArCurve> =
        wallet.get_prf_key(identity_provider_index, input.identity_index)?;

    let id_cred_sec: PedersenValue<ArCurve> =
        PedersenValue::new(wallet.get_id_cred_sec(identity_provider_index, input.identity_index)?);
    let id_cred: IdCredentials<ArCurve> = IdCredentials { id_cred_sec };

    let sig_retrievel_randomness: concordium_base::id::ps_sig::SigRetrievalRandomness<
        constants::IpPairing,
    > = wallet.get_blinding_randomness(identity_provider_index, input.identity_index)?;

    let num_of_ars = input.ars_infos.len();

    ensure!(input.ar_threshold > 0, "arThreshold must be at least 1.");
    ensure!(
        num_of_ars >= usize::from(input.ar_threshold),
        "Number of anonymity revokers in arsInfos should be at least arThreshold."
    );

    let threshold = Threshold(input.ar_threshold);

    let chi = CredentialHolderInfo::<ArCurve> { id_cred };

    let aci = AccCredentialInfo {
        cred_holder_info: chi,
        prf_key,
    };

    let context = IpContext::new(&input.ip_info, &input.ars_infos, &input.global_context);

    let id_use_data = IdObjectUseData {
        aci,
        randomness: sig_retrievel_randomness,
    };
    let (pio, _) = {
        match generate_pio_v1(&context, threshold, &id_use_data) {
            Some(x) => x,
            None => bail!("Generating the pre-identity object failed."),
        }
    };

    let response = json!({ "idObjectRequest": Versioned::new(VERSION_0, pio) });

    Ok(to_string(&response)?)
}

#[derive(SerdeSerialize, SerdeDeserialize)]
#[serde(rename_all = "camelCase")]
pub struct IdRecoveryRequestInput {
    ip_info:        IpInfo<constants::IpPairing>,
    global_context: GlobalContext<constants::ArCurve>,
    seed_as_hex:    String,
    net:            String,
    identity_index: u32,
    timestamp:      u64,
}

pub fn create_identity_recovery_request_aux(input: IdRecoveryRequestInput) -> Result<String> {
    let identity_provider_index = input.ip_info.ip_identity.0;
    let wallet = get_wallet(&input.seed_as_hex, &input.net)?;
    let id_cred_sec = wallet.get_id_cred_sec(identity_provider_index, input.identity_index)?;
    let request = generate_id_recovery_request(
        &input.ip_info,
        &input.global_context,
        &PedersenValue::new(id_cred_sec),
        input.timestamp,
    );

    let response = json!({
        "idRecoveryRequest": Versioned::new(VERSION_0, request),
    });
    Ok(to_string(&response)?)
}

#[derive(SerdeSerialize, SerdeDeserialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialInput {
    ip_info:             IpInfo<constants::IpPairing>,
    global_context:      GlobalContext<constants::ArCurve>,
    ars_infos:           BTreeMap<ArIdentity, ArInfo<constants::ArCurve>>,
    id_object:           IdentityObjectV1<constants::IpPairing, constants::ArCurve, AttributeKind>,
    revealed_attributes: Vec<AttributeTag>,
    seed_as_hex:         String,
    net:                 String,
    identity_index:      u32,
    cred_number:         u8,
    expiry:              TransactionTime,
}

/// A ConcordiumHdWallet together with an identity index and credential index
/// for the credential to be created. A CredentialContext can then be parsed to
/// the `create_credential` function due to the implementation of
/// `HasAttributeRandomness` below.
struct CredentialContext {
    wallet:                  ConcordiumHdWallet,
    identity_provider_index: u32,
    identity_index:          u32,
    credential_index:        u32,
}

impl HasAttributeRandomness<ArCurve> for CredentialContext {
    type ErrorType = DeriveError;

    fn get_attribute_commitment_randomness(
        &self,
        attribute_tag: AttributeTag,
    ) -> Result<PedersenRandomness<ArCurve>, Self::ErrorType> {
        self.wallet.get_attribute_commitment_randomness(
            self.identity_provider_index,
            self.identity_index,
            self.credential_index,
            attribute_tag,
        )
    }
}

pub fn create_credential_v1_aux(input: CredentialInput) -> Result<String> {
    let seed_decoded = hex::decode(&input.seed_as_hex)?;
    let seed: [u8; 64] = match seed_decoded.try_into() {
        Ok(s) => s,
        Err(_) => bail!("The provided seed {} was not 64 bytes", input.seed_as_hex),
    };

    let wallet = ConcordiumHdWallet {
        seed,
        net: get_net(&input.net)?,
    };

    let identity_provider_index = input.ip_info.ip_identity.0;

    let prf_key: prf::SecretKey<ArCurve> =
        wallet.get_prf_key(identity_provider_index, input.identity_index)?;

    let id_cred_sec: PedersenValue<ArCurve> =
        PedersenValue::new(wallet.get_id_cred_sec(identity_provider_index, input.identity_index)?);
    let id_cred: IdCredentials<ArCurve> = IdCredentials { id_cred_sec };

    let sig_retrievel_randomness: concordium_base::id::ps_sig::SigRetrievalRandomness<
        constants::IpPairing,
    > = wallet.get_blinding_randomness(identity_provider_index, input.identity_index)?;

    let chi = CredentialHolderInfo::<ArCurve> { id_cred };
    let aci = AccCredentialInfo {
        cred_holder_info: chi,
        prf_key,
    };
    let id_use_data = IdObjectUseData {
        aci,
        randomness: sig_retrievel_randomness,
    };

    // For now we can only create new accounts and do not support
    // adding credentials onto existing ones. Once that is supported the address
    // should be coming from the input data.
    let new_or_existing = Left(input.expiry);

    let cred_data = {
        let mut keys = std::collections::BTreeMap::new();
        let secret = wallet.get_account_signing_key(
            identity_provider_index,
            input.identity_index,
            u32::from(input.cred_number),
        )?;
        let public = (&secret).into();
        keys.insert(KeyIndex(0), KeyPair { secret, public });

        CredentialData {
            keys,
            threshold: SignatureThreshold(1),
        }
    };

    let context = IpContext::new(&input.ip_info, &input.ars_infos, &input.global_context);

    // And a policy.
    let mut policy_vec = std::collections::BTreeMap::new();
    for tag in input.revealed_attributes {
        if let Some(att) = input.id_object.alist.alist.get(&tag) {
            if policy_vec.insert(tag, att.clone()).is_some() {
                bail!("Cannot reveal an attribute more than once.")
            }
        } else {
            bail!("Cannot reveal an attribute which is not part of the attribute list.")
        }
    }

    let policy = Policy {
        valid_to: input.id_object.alist.valid_to,
        created_at: input.id_object.alist.created_at,
        policy_vec,
        _phantom: Default::default(),
    };

    let credential_context = CredentialContext {
        wallet,
        identity_provider_index,
        identity_index: input.identity_index,
        credential_index: u32::from(input.cred_number),
    };

    let (cdi, _) = create_credential(
        context,
        &input.id_object,
        &id_use_data,
        input.cred_number,
        policy,
        &cred_data,
        &credential_context,
        &new_or_existing,
    )?;

    let cdi_json = json!(cdi);
    Ok(cdi_json.to_string())
}

pub fn generate_unsigned_credential_aux(input: &str) -> Result<String> {
    let v: SerdeValue = from_str(input)?;
    let ip_info: IpInfo<constants::IpPairing> = try_get(&v, "ipInfo")?;

    let ars_infos: BTreeMap<ArIdentity, ArInfo<constants::ArCurve>> = try_get(&v, "arsInfos")?;

    let global_context: GlobalContext<constants::ArCurve> = try_get(&v, "global")?;

    let id_object: IdentityObject<constants::IpPairing, constants::ArCurve, AttributeKind> =
        try_get(&v, "identityObject")?;

    let tags: Vec<AttributeTag> = try_get(&v, "revealedAttributes")?;

    let cred_num: u8 = try_get(&v, "credentialNumber")?;

    let public_keys: Vec<VerifyKey> = try_get(&v, "publicKeys")?;
    let cred_key_info = CredentialPublicKeys {
        keys:      build_key_map(&public_keys),
        threshold: try_get(&v, "threshold")?,
    };

    let id_cred_sec: Value<constants::ArCurve> = try_get(&v, "idCredSec")?;
    let prf_key: prf::SecretKey<constants::ArCurve> = try_get(&v, "prfKey")?;

    let chi = CredentialHolderInfo::<constants::ArCurve> {
        id_cred: IdCredentials { id_cred_sec },
    };

    let aci = AccCredentialInfo {
        cred_holder_info: chi,
        prf_key,
    };

    let randomness_wrapped: RandomnessWrapper<constants::IpPairing> = try_get(&v, "randomness")?;

    let id_use_data = IdObjectUseData {
        aci,
        randomness: randomness_wrapped.randomness,
    };

    let mut policy_vec = std::collections::BTreeMap::new();
    for tag in tags {
        if let Some(att) = id_object.alist.alist.get(&tag) {
            if policy_vec.insert(tag, att.clone()).is_some() {
                bail!("Cannot reveal an attribute more than once.")
            }
        } else {
            bail!("Cannot reveal an attribute which is not part of the attribute list.")
        }
    }

    let policy = Policy {
        valid_to: id_object.alist.valid_to,
        created_at: id_object.alist.created_at,
        policy_vec,
        _phantom: Default::default(),
    };

    let context = IpContext::new(&ip_info, &ars_infos, &global_context);

    let address: Option<AccountAddress> = match try_get(&v, "address") {
        Ok(x) => Some(x),
        Err(_) => None,
    };

    let (unsigned_cdi, rand) = create_unsigned_credential(
        context,
        &id_object,
        &id_use_data,
        cred_num,
        policy,
        cred_key_info,
        address.as_ref(),
        &SystemAttributeRandomness {},
    )?;

    let response = json!({"unsignedCdi": unsigned_cdi, "randomness": rand});

    Ok(response.to_string())
}

fn get_credential_deployment_info(
    signatures: Vec<String>,
    unsigned_info: &str,
) -> Result<CredentialDeploymentInfo<constants::IpPairing, constants::ArCurve, AttributeKind>> {
    let v: SerdeValue = from_str(unsigned_info)?;
    let values: CredentialDeploymentValues<constants::ArCurve, AttributeKind> =
        from_str(unsigned_info)?;
    let proofs: IdOwnershipProofs<constants::IpPairing, constants::ArCurve> =
        try_get(&v, "proofs")?;
    let unsigned_credential_info = UnsignedCredentialDeploymentInfo::<
        constants::IpPairing,
        constants::ArCurve,
        AttributeKind,
    > {
        values,
        proofs,
    };

    let signature_map = build_signature_map(&signatures);
    let proof_acc_sk = AccountOwnershipProof {
        sigs: signature_map,
    };

    let cdp = CredDeploymentProofs {
        id_proofs: unsigned_credential_info.proofs,
        proof_acc_sk,
    };

    let cdi = CredentialDeploymentInfo {
        values: unsigned_credential_info.values,
        proofs: cdp,
    };

    Ok(cdi)
}

pub fn get_credential_deployment_details_aux(
    signatures: Vec<String>,
    unsigned_info: &str,
    expiry: u64,
) -> Result<String> {
    let cdi = get_credential_deployment_info(signatures, unsigned_info)?;

    let cdi_json = json!(cdi);

    let acc_cred = AccountCredential::Normal { cdi };

    let credential_message = AccountCredentialMessage {
        credential:     acc_cred,
        message_expiry: TransactionTime { seconds: expiry },
    };

    let hex = {
        let versioned = Versioned::new(VERSION_0, &credential_message);
        let versioned_as_bytes = &to_bytes(&versioned);
        hex::encode(versioned_as_bytes)
    };

    let block_item = concordium_base::transactions::BlockItem::<Payload>::from(credential_message);
    let hash = block_item.hash();

    let response = json!({
        "credInfo": cdi_json,
        "serializedTransaction": hex,
        "transactionHash": hash,
    });

    Ok(response.to_string())
}

/// Given the bytes of a credential deployment (/AccountCredentialMessage),
/// deserialize it and return as json.
pub fn deserialize_credential_deployment_aux(input: &str) -> Result<String> {
    let credential_message: AccountCredentialMessage<
        constants::IpPairing,
        constants::ArCurve,
        AttributeKind,
    > = concordium_base::common::from_bytes(&mut hex::decode(input)?.as_slice())?;
    let cdi_json = json!(credential_message);
    Ok(cdi_json.to_string())
}

pub fn get_credential_deployment_info_aux(
    signatures: Vec<String>,
    unsigned_info: &str,
) -> Result<String> {
    let cdi = get_credential_deployment_info(signatures, unsigned_info)?;
    let cdi_json = json!(cdi);
    Ok(cdi_json.to_string())
}

/// Given the bytes of a contract's state, deserialize them to a json object,
/// using the provided schema. Both the state bytes and the schema are given as
/// hex-encoded strings.
pub fn deserialize_state_aux(
    contract_name: &str,
    state_bytes: String,
    schema: String,
) -> Result<String> {
    let module_schema: ModuleV0 = match from_bytes(&hex::decode(schema)?) {
        Ok(o) => o,
        Err(e) => return Err(anyhow!("unable to parse schema: {:#?}", e)),
    };
    let mut state_cursor = Cursor::new(hex::decode(state_bytes)?);
    let contract_schema = module_schema
        .contracts
        .get(contract_name)
        .ok_or_else(|| anyhow!("Unable to get contract schema: not included in module schema"))?;
    let state_schema = contract_schema
        .state
        .as_ref()
        .ok_or_else(|| anyhow!("Unable to get state schema: not included in contract schema"))?;
    match state_schema.to_json(&mut state_cursor) {
        Ok(schema) => Ok(schema.to_string()),
        Err(e) => Err(anyhow!("Unable to parse state to json: {:?}", e)),
    }
}

/// Given the bytes of a receive function's return value, deserialize them to a
/// json object, using the provided schema.
pub fn deserialize_receive_return_value_aux(
    return_value_bytes: HexString,
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
) -> Result<JsonString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &schema_version)?;
    let return_value_schema =
        module_schema.get_receive_return_value_schema(contract_name, function_name)?;

    let mut rv_cursor = Cursor::new(hex::decode(return_value_bytes)?);
    match return_value_schema.to_json(&mut rv_cursor) {
        Ok(rv) => Ok(rv.to_string()),
        Err(_) => Err(anyhow!("Unable to parse return value to json.")),
    }
}

/// Given the bytes of a receive function's error, deserialize them to a json
/// object, using the provided schema.
pub fn deserialize_receive_error_aux(
    error_bytes: HexString,
    schema: HexString,
    contract_name: &str,
    function_name: &str,
) -> Result<JsonString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &None)?;
    let error_schema = module_schema.get_receive_error_schema(contract_name, function_name)?;

    let mut error_cursor = Cursor::new(hex::decode(error_bytes)?);
    match error_schema.to_json(&mut error_cursor) {
        Ok(e) => Ok(e.to_string()),
        Err(_) => Err(anyhow!("Unable to parse error value to json.")),
    }
}

/// Given the bytes of an init function's error, deserialize them to a json
/// object, using the provided schema.
pub fn deserialize_init_error_aux(
    error_bytes: HexString,
    schema: HexString,
    contract_name: &str,
) -> Result<JsonString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &None)?;
    let error_schema = module_schema.get_init_error_schema(contract_name)?;

    let mut error_cursor = Cursor::new(hex::decode(error_bytes)?);
    match error_schema.to_json(&mut error_cursor) {
        Ok(e) => Ok(e.to_string()),
        Err(_) => Err(anyhow!("Unable to parse error value to json.")),
    }
}

/// Given parameters to a receive function as a stringified json, serialize them
/// using the provided schema.
pub fn serialize_receive_contract_parameters_aux(
    parameters: JsonString,
    schema: HexString,
    contract_name: &str,
    function_name: &str,
    schema_version: Option<u8>,
) -> Result<HexString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &schema_version)?;
    let parameter_type = module_schema.get_receive_param_schema(contract_name, function_name)?;
    let value: SerdeValue = serde_json::from_str(&parameters)?;

    let buf = parameter_type.serial_value(&value)?;

    Ok(hex::encode(buf))
}

/// Given parameters to an init function as a stringified json, serialize them
/// using the provided schema.
pub fn serialize_init_contract_parameters_aux(
    parameters: JsonString,
    schema: HexString,
    contract_name: &str,
    schema_version: Option<u8>,
) -> Result<HexString> {
    let module_schema = VersionedModuleSchema::new(&hex::decode(schema)?, &schema_version)?;
    let parameter_type = module_schema.get_init_param_schema(contract_name)?;
    let value: SerdeValue = serde_json::from_str(&parameters)?;

    let buf = parameter_type.serial_value(&value)?;

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

pub fn serialize_type_value_aux(parameters: JsonString, schema: HexString) -> Result<HexString> {
    let parameter_type: Type = from_bytes(&hex::decode(schema)?)?;
    serialize_type_value(parameters, parameter_type)
}

fn serialize_type_value(raw_value: JsonString, value_type: Type) -> Result<HexString> {
    let value: SerdeValue = serde_json::from_str(&raw_value)?;

    let buf = value_type.serial_value(&value)?;
    Ok(hex::encode(buf))
}

#[derive(SerdeSerialize, SerdeDeserialize)]
#[serde(rename_all = "camelCase")]
pub struct IdProofInput {
    id_object: IdentityObjectV1<constants::IpPairing, constants::ArCurve, AttributeKind>,
    global_context:          GlobalContext<constants::ArCurve>,
    seed_as_hex:             String,
    net:                     String,
    identity_provider_index: u32,
    identity_index:          u32,
    cred_number:             u8,
    statement:               Statement<constants::ArCurve, AttributeKind>,
    challenge:               String,
}

#[derive(SerdeSerialize, SerdeDeserialize)]
struct IdProofOutput {
    credential: String,
    proof:      Versioned<Proof<constants::ArCurve, AttributeKind>>,
}

pub fn create_id_proof_aux(input: IdProofInput) -> Result<String> {
    let seed_decoded = hex::decode(&input.seed_as_hex)?;
    let seed: [u8; 64] = match seed_decoded.try_into() {
        Ok(s) => s,
        Err(_) => bail!("The provided seed {} was not 64 bytes", input.seed_as_hex),
    };

    let challenge_decoded = hex::decode(&input.challenge)?;

    let wallet = ConcordiumHdWallet {
        seed,
        net: get_net(&input.net)?,
    };

    let attribute_list = input.id_object.alist;

    let cred_id_exponent = wallet
        .get_prf_key(input.identity_provider_index, input.identity_index)?
        .prf_exponent(input.cred_number)?;

    let credential_context = CredentialContext {
        wallet,
        identity_provider_index: input.identity_provider_index,
        credential_index: u32::from(input.cred_number),
        identity_index: input.identity_index,
    };

    let credential = input
        .global_context
        .on_chain_commitment_key
        .hide(
            &Value::<constants::ArCurve>::new(cred_id_exponent),
            &PedersenRandomness::zero(),
        )
        .0;

    let proof = StatementWithContext {
        credential,
        statement: input.statement,
    }
    .prove(
        &input.global_context,
        &challenge_decoded,
        &attribute_list,
        &credential_context,
    )
    .context("Unable to generate proof.")?;

    let out = IdProofOutput {
        credential: base16_encode_string(&credential),
        proof:      Versioned::new(VERSION_0, proof),
    };

    Ok(json!(out).to_string())
}

pub fn serialize_credential_deployment_payload_aux(
    signatures: Vec<String>,
    unsigned_info: &str,
) -> Result<Vec<u8>> {
    let cdi = get_credential_deployment_info(signatures, unsigned_info)?;

    let acc_cred = AccountCredential::Normal { cdi };

    let mut acc_cred_ser = Vec::<u8>::new();
    acc_cred.serial(&mut acc_cred_ser);

    Ok(acc_cred_ser)
}

#[derive(SerdeSerialize, SerdeDeserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnsignedCredentialInput {
    ip_info:                  IpInfo<constants::IpPairing>,
    global_context:           GlobalContext<constants::ArCurve>,
    ars_infos:                BTreeMap<ArIdentity, ArInfo<constants::ArCurve>>,
    id_object: IdentityObjectV1<constants::IpPairing, constants::ArCurve, AttributeKind>,
    id_cred_sec:              PedersenValue<ArCurve>,
    prf_key:                  prf::SecretKey<ArCurve>,
    sig_retrievel_randomness: String,
    credential_public_keys:   CredentialPublicKeys,
    attribute_randomness:     BTreeMap<AttributeTag, PedersenRandomness<ArCurve>>,
    revealed_attributes:      Vec<AttributeTag>,
    cred_number:              u8,
}

struct AttributeRandomness(BTreeMap<AttributeTag, PedersenRandomness<ArCurve>>);

#[derive(Debug, Error)]
pub enum AttributeError {
    #[error("Missing randomness for given attribute tag.")]
    NotFound,
}

impl HasAttributeRandomness<ArCurve> for AttributeRandomness {
    type ErrorType = AttributeError;

    fn get_attribute_commitment_randomness(
        &self,
        attribute_tag: AttributeTag,
    ) -> Result<PedersenRandomness<ArCurve>, Self::ErrorType> {
        match self.0.get(&attribute_tag) {
            Some(v) => Ok(v.clone()),
            None => Err(AttributeError::NotFound),
        }
    }
}

pub fn create_unsigned_credential_v1_aux(input: UnsignedCredentialInput) -> Result<String> {
    let chi = CredentialHolderInfo::<constants::ArCurve> {
        id_cred: IdCredentials {
            id_cred_sec: input.id_cred_sec,
        },
    };
    let aci = AccCredentialInfo {
        cred_holder_info: chi,
        prf_key:          input.prf_key,
    };

    let blinding_randomness: Value<constants::ArCurve> = concordium_base::common::from_bytes(
        &mut hex::decode(&input.sig_retrievel_randomness)?.as_slice(),
    )?;
    let id_use_data = IdObjectUseData {
        aci,
        randomness:
            concordium_base::id::ps_sig::SigRetrievalRandomness::<constants::IpPairing>::new(
                *blinding_randomness,
            ),
    };

    let context = IpContext::new(&input.ip_info, &input.ars_infos, &input.global_context);

    // And a policy.
    let mut policy_vec = std::collections::BTreeMap::new();
    for tag in input.revealed_attributes {
        if let Some(att) = input.id_object.alist.alist.get(&tag) {
            if policy_vec.insert(tag, att.clone()).is_some() {
                bail!("Cannot reveal an attribute more than once.")
            }
        } else {
            bail!("Cannot reveal an attribute which is not part of the attribute list.")
        }
    }

    let policy = Policy {
        valid_to: input.id_object.alist.valid_to,
        created_at: input.id_object.alist.created_at,
        policy_vec,
        _phantom: Default::default(),
    };

    let (cdi, rand) = create_unsigned_credential(
        context,
        &input.id_object,
        &id_use_data,
        input.cred_number,
        policy,
        input.credential_public_keys,
        None,
        &AttributeRandomness(input.attribute_randomness),
    )?;

    let response = json!({"unsignedCdi": cdi, "randomness": rand});

    Ok(response.to_string())
}
