use crate::external_functions::BakerKeyVariant;
use crate::{helpers::*, types::*};
use crypto_common::{types::TransactionTime, *};
use dodis_yampolskiy_prf as prf;
use pairing::bls12_381::{Bls12, G1};
use serde_json::{from_str, Value as SerdeValue};
use std::collections::BTreeMap;
type ExampleCurve = G1;
use serde::{Deserialize as SerdeDeserialize, Serialize as SerdeSerialize};
use sha2::{Digest, Sha256};
use eddsa_ed25519::{prove_dlog_ed25519, Ed25519DlogProof};
use ed25519_dalek as ed25519;
use random_oracle::RandomOracle;
use rand::thread_rng;
use concordium_contracts_common::{from_bytes, Cursor, schema};
use hex;

use anyhow::{bail, Result, anyhow};
use id::{account_holder::create_unsigned_credential, constants::AttributeKind, types::*};
use pedersen_scheme::Value;

#[derive(SerdeSerialize, SerdeDeserialize)]
pub struct CredId {
    #[serde(
        rename = "credId",
        serialize_with = "base16_encode",
        deserialize_with = "base16_decode"
    )]
    pub cred_id: ExampleCurve,
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
        keys: build_key_map(&public_keys),
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
        credential: acc_cred,
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

pub fn get_credential_deployment_info_aux(
    signatures: Vec<String>,
    unsigned_info: &str,
) -> Result<String> {
    let cdi = get_credential_deployment_info(signatures, unsigned_info)?;
    let cdi_json = json!(cdi);
    Ok(cdi_json.to_string())
}

#[derive(SerdeSerialize)]
#[serde(rename_all = "camelCase")]
pub struct BakerKeys {
    #[serde(serialize_with = "base16_encode")]
    election_secret: ed25519::SecretKey,
    #[serde(serialize_with = "base16_encode")]
    election_public: ed25519::PublicKey,
    #[serde(serialize_with = "base16_encode")]
    signature_secret: ed25519::SecretKey,
    #[serde(serialize_with = "base16_encode")]
    signature_public: ed25519::PublicKey,
    #[serde(serialize_with = "base16_encode")]
    aggregation_secret: aggregate_sig::SecretKey<Bls12>,
    #[serde(serialize_with = "base16_encode")]
    aggregation_public: aggregate_sig::PublicKey<Bls12>,
    #[serde(serialize_with = "base16_encode")]
    proof_election: Ed25519DlogProof,
    #[serde(serialize_with = "base16_encode")]
    proof_signature: Ed25519DlogProof,
    #[serde(serialize_with = "base16_encode")]
    proof_aggregation: aggregate_sig::Proof<Bls12>
}

pub fn generate_baker_keys(sender: &AccountAddress, key_variant: BakerKeyVariant) -> BakerKeys {
    let mut csprng = thread_rng();
    let election = ed25519::Keypair::generate(&mut csprng);
    let signature = ed25519::Keypair::generate(&mut csprng);
    let aggregation_secret = aggregate_sig::SecretKey::<Bls12>::generate(&mut csprng);
    let aggregation_public = aggregate_sig::PublicKey::<Bls12>::from_secret(&aggregation_secret);

    let mut challenge = match key_variant {
        BakerKeyVariant::ADD => b"addBaker".to_vec(),
        BakerKeyVariant::UPDATE => b"updateBakerKeys".to_vec()
    };

    sender.serial(&mut challenge);
    election.public.serial(&mut challenge);
    signature.public.serial(&mut challenge);
    aggregation_public.serial(&mut challenge);

    let proof_election = prove_dlog_ed25519(&mut RandomOracle::domain(&challenge), &election.public, &election.secret);
    let proof_signature = prove_dlog_ed25519(&mut RandomOracle::domain(&challenge), &signature.public, &signature.secret);
    let proof_aggregation = aggregation_secret.prove(&mut csprng, &mut RandomOracle::domain(&challenge));

    BakerKeys {
        election_secret: election.secret,
        election_public: election.public,
        signature_secret: signature.secret,
        signature_public: signature.public,
        aggregation_secret,
        aggregation_public,
        proof_election,
        proof_signature,
        proof_aggregation
    }
}

/// Given the bytes of a contract's state, deserialize them to a json object, using the provided schema.
/// Both the state bytes and the schema are given as hex-encoded strings.
pub fn deserialize_state_aux(
    contract_name: &str,
    state_bytes: String,
    schema: String,
) -> Result<String> {
    let module_schema: schema::Module = match from_bytes(&hex::decode(schema)?) {
        Ok(o) => o,
        Err(e) => return Err(anyhow!("unable to parse schema: {:#?}", e))
    };
    let mut state_cursor = Cursor::new(hex::decode(state_bytes)?);
    let contract_schema = module_schema.contracts.get(contract_name).ok_or(anyhow!("Unable to get contract schema: not included in module schema"))?;
    let state_schema = contract_schema.state.as_ref().ok_or(anyhow!("Unable to get state schema: not included in contract schema"))?;
    Ok(state_schema.to_json(&mut state_cursor).expect("Unable to parse state to json").to_string())
}
