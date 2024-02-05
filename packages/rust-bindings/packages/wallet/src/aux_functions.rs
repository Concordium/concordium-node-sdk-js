use anyhow::{anyhow, bail, Context, Result};
use concordium_base::{
    base::{BakerAggregationSignKey, BakerElectionSignKey, BakerKeyPairs, BakerSignatureSignKey},
    cis4_types::IssuerKey,
    common::{
        types::{KeyIndex, KeyPair, TransactionTime},
        *,
    },
    contracts_common::ContractAddress,
    curve_arithmetic::Pairing,
    id::{
        account_holder::{create_credential, create_unsigned_credential},
        constants,
        constants::{ArCurve, AttributeKind},
        dodis_yampolskiy_prf as prf,
        id_proof_types::{Proof, ProofVersion, Statement, StatementWithContext},
        pedersen_commitment::{Randomness as PedersenRandomness, Value as PedersenValue, Value},
        types::*,
    },
    ps_sig::SigRetrievalRandomness,
    transactions::{ConfigureBakerKeysPayload, Payload},
    web3id::{
        CredentialHolderId, SignedCommitments, Web3IdAttribute,
    },
};
use concordium_rust_bindings_common::types::{HexString, JsonString};
use either::Either::Left;
use key_derivation::{ConcordiumHdWallet, CredentialContext, Net};
use rand::thread_rng;
use serde::{Deserialize as SerdeDeserialize, Serialize as SerdeSerialize};
use serde_json::{from_str, from_value, Value as SerdeValue};
use std::{collections::BTreeMap, convert::TryInto};
use thiserror::Error;

#[derive(SerdeSerialize, SerdeDeserialize)]
#[serde(bound(serialize = "P: Pairing", deserialize = "P: Pairing"))]
pub struct RandomnessWrapper<P: Pairing> {
    #[serde(
        rename = "randomness",
        serialize_with = "base16_encode",
        deserialize_with = "base16_decode"
    )]
    pub randomness: SigRetrievalRandomness<P>,
}

fn build_key_map(keys: &[VerifyKey]) -> BTreeMap<KeyIndex, VerifyKey> {
    keys.iter()
        .enumerate()
        .map(|(index, key)| (KeyIndex(index.try_into().unwrap()), key.clone()))
        .collect()
}

fn build_signature_map(signatures: &[String]) -> BTreeMap<KeyIndex, AccountOwnershipSignature> {
    signatures
        .iter()
        .enumerate()
        .map(|(index, key)| {
            (
                KeyIndex(index.try_into().unwrap()),
                base16_decode_string(key).unwrap(),
            )
        })
        .collect()
}

fn build_policy(
    attributes: &AttributeList<constants::BaseField, constants::AttributeKind>,
    revealed_attributes: Vec<AttributeTag>,
) -> Result<Policy<constants::ArCurve, constants::AttributeKind>> {
    let mut policy_vec = std::collections::BTreeMap::new();
    for tag in revealed_attributes {
        if let Some(att) = attributes.alist.get(&tag) {
            if policy_vec.insert(tag, att.clone()).is_some() {
                bail!("Cannot reveal an attribute more than once.")
            }
        } else {
            bail!("Cannot reveal an attribute which is not part of the attribute list.")
        }
    }
    Ok(Policy {
        valid_to: attributes.valid_to,
        created_at: attributes.created_at,
        policy_vec,
        _phantom: Default::default(),
    })
}

/// Try to extract a field with a given name from the JSON value.
fn try_get<A: serde::de::DeserializeOwned>(v: &SerdeValue, fname: &str) -> Result<A> {
    match v.get(fname) {
        Some(v) => Ok(from_value(v.clone())?),
        None => Err(anyhow!("Field {} not present, but should be.", fname)),
    }
}

#[derive(SerdeSerialize, SerdeDeserialize)]
pub struct CredId {
    #[serde(
        rename = "credId",
        serialize_with = "base16_encode",
        deserialize_with = "base16_decode"
    )]
    pub cred_id: constants::ArCurve,
}

fn get_net(net: &str) -> Result<Net> {
    Ok(match net {
        "Mainnet" => Net::Mainnet,
        "Testnet" => Net::Testnet,
        _ => bail!("Unknown net"),
    })
}

#[derive(SerdeSerialize, SerdeDeserialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialInput {
    ip_info:             IpInfo<constants::IpPairing>,
    global_context:      GlobalContext<constants::ArCurve>,
    ars_infos:           BTreeMap<ArIdentity, ArInfo<constants::ArCurve>>,
    id_object:           IdentityObjectV1<constants::IpPairing, constants::ArCurve, AttributeKind>,
    revealed_attributes: Vec<AttributeTag>,
    seed_as_hex:         HexString,
    net:                 String,
    identity_index:      u32,
    cred_number:         u8,
    expiry:              TransactionTime,
}

pub fn create_credential_v1_aux(input: CredentialInput) -> Result<JsonString> {
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
        keys.insert(KeyIndex(0), KeyPair::from(ed25519_dalek::SigningKey::from_bytes(&secret)));

        CredentialData {
            keys,
            threshold: SignatureThreshold::ONE,
        }
    };

    let context = IpContext::new(&input.ip_info, &input.ars_infos, &input.global_context);

    let policy = build_policy(&input.id_object.alist, input.revealed_attributes)?;

    let credential_context = CredentialContext {
        wallet,
        identity_provider_index: identity_provider_index.into(),
        identity_index: input.identity_index,
        credential_index: input.cred_number,
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

pub fn generate_unsigned_credential_aux(input: &str) -> Result<JsonString> {
    let v: SerdeValue = from_str(input)?;
    let ip_info: IpInfo<constants::IpPairing> = try_get(&v, "ipInfo")?;

    let ars_infos: BTreeMap<ArIdentity, ArInfo<constants::ArCurve>> = try_get(&v, "arsInfos")?;

    let global_context: GlobalContext<constants::ArCurve> = try_get(&v, "global")?;

    let id_object: IdentityObject<constants::IpPairing, constants::ArCurve, AttributeKind> =
        try_get(&v, "identityObject")?;

    let revealed_attributes: Vec<AttributeTag> = try_get(&v, "revealedAttributes")?;

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

    let policy = build_policy(&id_object.alist, revealed_attributes)?;

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
) -> Result<JsonString> {
    let cdi = get_credential_deployment_info(signatures, unsigned_info)?;

    let cdi_json = json!(cdi);

    let acc_cred = AccountCredential::Normal { cdi };

    let credential_message = AccountCredentialMessage {
        credential:     acc_cred,
        message_expiry: TransactionTime { seconds: expiry },
    };

    let block_item = concordium_base::transactions::BlockItem::<Payload>::from(credential_message);

    let hex = {
        let versioned = Versioned::new(VERSION_0, &block_item);
        let versioned_as_bytes = &to_bytes(&versioned);
        hex::encode(versioned_as_bytes)
    };

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
pub fn deserialize_credential_deployment_aux(input: &str) -> Result<JsonString> {
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
) -> Result<JsonString> {
    let cdi = get_credential_deployment_info(signatures, unsigned_info)?;
    let cdi_json = json!(cdi);
    Ok(cdi_json.to_string())
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

pub fn create_id_proof_aux(input: IdProofInput) -> Result<JsonString> {
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
        identity_provider_index: input.identity_provider_index.into(),
        credential_index: input.cred_number,
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
        ProofVersion::Version1,
        &input.global_context,
        &challenge_decoded,
        &attribute_list,
        &credential_context,
    )
    .context("Unable to generate proof")?;

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
        attribute_tag: &AttributeTag,
    ) -> Result<PedersenRandomness<ArCurve>, Self::ErrorType> {
        match self.0.get(attribute_tag) {
            Some(v) => Ok(v.clone()),
            None => Err(AttributeError::NotFound),
        }
    }
}

#[derive(SerdeSerialize)]
#[serde(rename_all = "camelCase")]
pub struct BakerKeys {
    #[serde(flatten)]
    keys_payload:         ConfigureBakerKeysPayload,
    #[serde(serialize_with = "base16_encode", rename = "electionPrivateKey")]
    election_private_key: BakerElectionSignKey,
    #[serde(serialize_with = "base16_encode", rename = "signatureSignKey")]
    signature_sign_key:   BakerSignatureSignKey,
    #[serde(serialize_with = "base16_encode", rename = "aggregationSignKey")]
    aggregation_sign_key: BakerAggregationSignKey,
}

pub fn generate_baker_keys(sender: AccountAddress) -> Result<JsonString> {
    let mut csprng = thread_rng();
    let keys = BakerKeyPairs::generate(&mut csprng);
    let keys_payload = ConfigureBakerKeysPayload::new(&keys, sender, &mut csprng);
    let output = BakerKeys {
        keys_payload,
        election_private_key: keys.election_sign,
        signature_sign_key: keys.signature_sign,
        aggregation_sign_key: keys.aggregation_sign,
    };
    Ok(serde_json::to_string(&output)?)
}

#[derive(SerdeDeserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyWeb3IdCredentialSignatureInput {
    global_context:    GlobalContext<constants::ArCurve>,
    values:            BTreeMap<String, Web3IdAttribute>,
    randomness:        BTreeMap<String, PedersenRandomness<constants::ArCurve>>,
    #[serde(serialize_with = "base16_encode", deserialize_with = "base16_decode")]
    signature:         ed25519_dalek::Signature,
    holder:            CredentialHolderId,
    issuer_public_key: IssuerKey,
    issuer_contract:   ContractAddress,
}

pub fn verify_web3_id_credential_signature_aux(
    input: VerifyWeb3IdCredentialSignatureInput,
) -> Result<bool> {
    let cmm_key = &input.global_context.on_chain_commitment_key;
    let mut commitments = BTreeMap::new();
    for ((vi, value), (ri, randomness)) in input.values.iter().zip(input.randomness.iter()) {
        if vi != ri {
            return Err(anyhow!("Values and randomness does not match"));
        }
        commitments.insert(
            ri.clone(),
            cmm_key.hide(
                &Value::<constants::ArCurve>::new(value.to_field_element()),
                randomness,
            ),
        );
    }
    Ok(SignedCommitments {
        signature: input.signature,
        commitments,
    }
    .verify_signature(
        &input.holder,
        &input.issuer_public_key,
        input.issuer_contract,
    ))
}
