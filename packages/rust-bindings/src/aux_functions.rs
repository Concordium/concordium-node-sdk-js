use crate::{helpers::*, types::*};
use crypto_common::{types::TransactionTime, *};
use dodis_yampolskiy_prf as prf;
use pairing::bls12_381::{Bls12, G1};
use serde_json::{from_str, Value as SerdeValue};
use std::{collections::BTreeMap, convert::TryInto};
type ExampleCurve = G1;
use concordium_contracts_common::{from_bytes, schema, Cursor};
use hex;
use key_derivation::{ConcordiumHdWallet, Net};
use serde::{Deserialize as SerdeDeserialize, Serialize as SerdeSerialize};
use sha2::{Digest, Sha256};

use anyhow::{anyhow, bail, ensure, Result};
use id::{
    account_holder::{create_unsigned_credential, generate_pio_v1},
    constants::{ArCurve, AttributeKind},
    pedersen_commitment::Value as PedersenValue,
    types::*,
};
use pedersen_scheme::Value;
use serde_json::to_string;

use id::secret_sharing::Threshold;

#[derive(SerdeSerialize, SerdeDeserialize)]
pub struct CredId {
    #[serde(
        rename = "credId",
        serialize_with = "base16_encode",
        deserialize_with = "base16_decode"
    )]
    pub cred_id: ExampleCurve,
}

#[derive(SerdeSerialize, SerdeDeserialize)]
#[serde(rename_all = "camelCase")]
pub struct IdRequestInput {
    ip_info:        IpInfo<Bls12>,
    global_context: GlobalContext<ExampleCurve>,
    ars_infos:      BTreeMap<ArIdentity, ArInfo<ExampleCurve>>,
    seed:           String,
    net:            String,
    identity_index: u32,
    ar_threshold:   u8,
}

pub fn create_id_request_v1_aux(input: IdRequestInput) -> Result<String> {
    let seed_decoded = hex::decode(&input.seed)?;
    let seed: [u8; 64] = match seed_decoded.try_into() {
        Ok(s) => s,
        Err(_) => bail!("The provided seed {} was not 64 bytes", input.seed),
    };

    let net = match input.net.as_str() {
        "Mainnet" => Net::Mainnet,
        "Testnet" => Net::Testnet,
        _ => bail!("Unknown net"),
    };
    let wallet = ConcordiumHdWallet { seed, net };

    let prf_key: prf::SecretKey<ArCurve> = wallet.get_prf_key(input.identity_index)?;

    let id_cred_sec: PedersenValue<ArCurve> =
        PedersenValue::new(wallet.get_id_cred_sec(input.identity_index)?);
    let id_cred: IdCredentials<ArCurve> = IdCredentials { id_cred_sec };

    let sig_retrievel_randomness: ps_sig::SigRetrievalRandomness<Bls12> =
        wallet.get_blinding_randomness(input.identity_index)?;

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

pub fn generate_unsigned_credential_aux(input: &str) -> Result<String> {
    let v: SerdeValue = from_str(input)?;
    let ip_info: IpInfo<Bls12> = try_get(&v, "ipInfo")?;

    let ars_infos: BTreeMap<ArIdentity, ArInfo<ExampleCurve>> = try_get(&v, "arsInfos")?;

    let global_context: GlobalContext<ExampleCurve> = try_get(&v, "global")?;

    let id_object: IdentityObject<Bls12, ExampleCurve, AttributeKind> =
        try_get(&v, "identityObject")?;

    let tags: Vec<AttributeTag> = try_get(&v, "revealedAttributes")?;

    let cred_num: u8 = try_get(&v, "credentialNumber")?;

    let public_keys: Vec<VerifyKey> = try_get(&v, "publicKeys")?;
    let cred_key_info = CredentialPublicKeys {
        keys:      build_key_map(&public_keys),
        threshold: try_get(&v, "threshold")?,
    };

    let id_cred_sec: Value<ExampleCurve> = try_get(&v, "idCredSec")?;
    let prf_key: prf::SecretKey<ExampleCurve> = try_get(&v, "prfKey")?;

    let chi = CredentialHolderInfo::<ExampleCurve> {
        id_cred: IdCredentials { id_cred_sec },
    };

    let aci = AccCredentialInfo {
        cred_holder_info: chi,
        prf_key,
    };

    let randomness_wrapped: RandomnessWrapper<Bls12> = try_get(&v, "randomness")?;

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
) -> Result<CredentialDeploymentInfo<Bls12, ExampleCurve, AttributeKind>> {
    let v: SerdeValue = from_str(unsigned_info)?;
    let values: CredentialDeploymentValues<ExampleCurve, AttributeKind> = from_str(unsigned_info)?;
    let proofs: IdOwnershipProofs<Bls12, ExampleCurve> = try_get(&v, "proofs")?;
    let unsigned_credential_info =
        UnsignedCredentialDeploymentInfo::<Bls12, ExampleCurve, AttributeKind> { values, proofs };

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

    let block_item = BlockItem::Deployment(credential_message);

    let hash = {
        let info_as_bytes = &to_bytes(&block_item);
        hex::encode(Sha256::digest(info_as_bytes))
    };

    let hex = {
        let versioned = Versioned::new(VERSION_0, block_item);
        let versioned_as_bytes = &to_bytes(&versioned);
        hex::encode(versioned_as_bytes)
    };

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
    let credential_message: AccountCredentialMessage<Bls12, ExampleCurve, AttributeKind> =
        crypto_common::from_bytes(&mut hex::decode(input)?.as_slice())?;
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
    let module_schema: schema::Module = match from_bytes(&hex::decode(schema)?) {
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
