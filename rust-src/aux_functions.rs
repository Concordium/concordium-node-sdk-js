use crate::{helpers::*, types::*};
use crypto_common::{types::TransactionTime, *};
use dodis_yampolskiy_prf as prf;
use pairing::bls12_381::{Bls12, G1};
use serde_json::{from_str, Value as SerdeValue};
use std::collections::BTreeMap;
type ExampleCurve = G1;
use serde::{Deserialize as SerdeDeserialize, Serialize as SerdeSerialize};
use sha2::{Digest, Sha256};
// Used for shielded transfer:
use encrypted_transfers::types::{AggregatedDecryptedAmount, EncryptedAmount, EncryptedAmountAggIndex};
use elgamal::BabyStepGiantStep;
use rand::thread_rng;
use crypto_common::types::Amount;


#[derive(SerdeSerialize, SerdeDeserialize)]
pub struct CredId {
    #[serde(
        rename = "credId",
        serialize_with = "base16_encode",
        deserialize_with = "base16_decode"
    )]
    pub cred_id: ExampleCurve,
}

use anyhow::{bail, Result};
use id::{account_holder::create_unsigned_credential, constants::AttributeKind, types::*};
use pedersen_scheme::Value;

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

pub fn create_encrypted_transfer_aux(
    input: &str
)  -> Result<String> {
    let v: SerdeValue = from_str(input)?;

    let global_context: GlobalContext<ExampleCurve> = try_get(&v, "global")?;

    let receiver_pk = try_get(&v, "receiverPublicKey")?;

    let secret_key: elgamal::SecretKey<ExampleCurve> = try_get(&v, "senderDecryptionKey")?;

    let incoming_amounts: Vec<EncryptedAmount<ExampleCurve>> = try_get(&v, "incomingAmounts")?;
    let self_amount: EncryptedAmount<ExampleCurve> = try_get(&v, "encryptedSelfAmount")?;
    let index: u64 = try_get::<String>(&v, "aggIndex")?.parse::<u64>()?;
    let agg_index = EncryptedAmountAggIndex{ index };

    let input_amount = incoming_amounts.iter().fold(self_amount, |acc, amount| encrypted_transfers::aggregate(&acc,amount));
    let m = 1 << 16;
    let table = BabyStepGiantStep::new(global_context.encryption_in_exponent_generator(), m);

    let decrypted_amount =
        encrypted_transfers::decrypt_amount::<ExampleCurve>(
            &table,
            &secret_key,
            &input_amount,
        );

    let agg_decrypted_amount = AggregatedDecryptedAmount {
        agg_encrypted_amount: input_amount,
        agg_amount: decrypted_amount,
        agg_index
    };

    let to_transfer: Amount = try_get(&v, "amount")?;

    let mut csprng = thread_rng();

    let payload =encrypted_transfers::make_transfer_data(
        &global_context,
        &receiver_pk,
        &secret_key,
        &agg_decrypted_amount,
        to_transfer,
        &mut csprng,
    );

    let payload = match payload {
        Some(payload) => payload,
        None => bail!("Could not produce payload."),
    };

    let response = json!(payload);
    Ok(response.to_string())
}

pub fn create_transfer_to_public_aux(
    input: &str
) -> Result<String> {
    let v: SerdeValue = from_str(input)?;

    let global_context: GlobalContext<ExampleCurve> = try_get(&v, "global")?;

    let secret_key: elgamal::SecretKey<ExampleCurve> = try_get(&v, "senderDecryptionKey")?;

    let incoming_amounts: Vec<EncryptedAmount<ExampleCurve>> = try_get(&v, "incomingAmounts")?;
    let self_amount: EncryptedAmount<ExampleCurve> = try_get(&v, "encryptedSelfAmount")?;
    let index: u64 = try_get::<String>(&v, "aggIndex")?.parse::<u64>()?;
    let agg_index = EncryptedAmountAggIndex{ index };

    let input_amount = incoming_amounts.iter().fold(self_amount, |acc, amount| encrypted_transfers::aggregate(&acc,amount));
    let m = 1 << 16;
    let table = BabyStepGiantStep::new(global_context.encryption_in_exponent_generator(), m);

    let decrypted_amount =
        encrypted_transfers::decrypt_amount::<ExampleCurve>(
        &table,
        &secret_key,
        &input_amount,
    );

    let agg_decrypted_amount = AggregatedDecryptedAmount {
        agg_encrypted_amount: input_amount,
        agg_amount: decrypted_amount,
        agg_index
    };

    let to_transfer: Amount = try_get(&v, "amount")?;

    let mut csprng = thread_rng();

    let payload =encrypted_transfers::make_sec_to_pub_transfer_data(
        &global_context,
        &secret_key,
        &agg_decrypted_amount,
        to_transfer,
        &mut csprng,
    );

    let payload = match payload {
        Some(payload) => payload,
        None => bail!("Could not produce payload."),
    };

    let response = json!(payload);
    Ok(response.to_string())
}

