use std::collections::HashMap;

use anyhow::Context;
use concordium_base::{
    self as base,
    common::cbor::{self, cbor_encode},
    id::{
        constants::{ArCurve, IpPairing},
        types::GlobalContext,
    },
    web3id::{
        v1::{
            anchor::{
                RequestedSubjectClaims, UnfilledContextInformation, VerificationAuditRecord,
                VerificationRequestData,
            },
            CredentialVerificationMaterial, PresentationV1,
        },
        CredentialsInputs, Presentation, Web3IdAttribute,
    },
};
use concordium_rust_bindings_common::types::JsonString;
use serde::de;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerifyPresentationInput {
    presentation: Presentation<ArCurve, Web3IdAttribute>,
    global_context: GlobalContext<ArCurve>,
    public_data: Vec<CredentialsInputs<ArCurve>>,
}

pub fn verify_presentation(input: JsonString) -> anyhow::Result<JsonString> {
    let input: VerifyPresentationInput = serde_json::from_str(&input)?;
    let request = input
        .presentation
        .verify(&input.global_context, input.public_data.iter())?;
    let request = serde_json::to_string(&request)?;
    Ok(request)
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct PresentationV1Input {
    request: base::web3id::v1::RequestV1<ArCurve, Web3IdAttribute>,
    global: GlobalContext<ArCurve>,
    inputs: Vec<
        base::web3id::v1::OwnedCredentialProofPrivateInputs<IpPairing, ArCurve, Web3IdAttribute>,
    >,
}

pub fn create_presentation_v1(raw_input: JsonString) -> anyhow::Result<JsonString> {
    let PresentationV1Input {
        request,
        global,
        inputs,
    } = serde_json::from_str(&raw_input)?;
    let inputs = inputs.iter().map(|i| i.borrow());
    let presentation = request.prove(&global, inputs.into_iter())?;

    serde_json::to_string(&presentation).context("Failed to serialize PresentationV1")
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerificationV1Input {
    presentation: PresentationV1<IpPairing, ArCurve, Web3IdAttribute>,
    global_context: GlobalContext<ArCurve>,
    public_data: Vec<CredentialVerificationMaterial<IpPairing, ArCurve>>,
}

pub fn verify_presentation_v1(raw_input: JsonString) -> anyhow::Result<JsonString> {
    let VerificationV1Input {
        public_data,
        global_context,
        presentation,
    } = serde_json::from_str(&raw_input)?;

    let request = presentation.verify(&global_context, public_data.iter())?;
    serde_json::to_string(&request).context("Failed to serialize RequestV1")
}

#[derive(Clone)]
struct PublicInfo(HashMap<String, cbor::value::Value>);

impl<'de> serde::Deserialize<'de> for PublicInfo {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let string_map: HashMap<String, String> = HashMap::deserialize(deserializer)?;
        let mapped: Result<HashMap<String, cbor::value::Value>, D::Error> = string_map
            .into_iter()
            .map(|(k, v)| {
                let bytes = hex::decode(&v).map_err(de::Error::custom)?;
                let value: cbor::value::Value =
                    cbor::cbor_decode(&bytes).map_err(de::Error::custom)?;
                Ok((k, value))
            })
            .collect();
        Ok(Self(mapped?))
    }
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerificationRequestV1Input {
    /// Context information for a verifiable presentation request.
    pub context: UnfilledContextInformation,
    /// The claims for a list of subjects containing requested statements about the subjects.
    pub subject_claims: Vec<RequestedSubjectClaims>,
    /// The optional public info to register with the anchor.
    pub public_info: Option<PublicInfo>,
}

impl From<VerificationRequestV1Input> for VerificationRequestData {
    fn from(value: VerificationRequestV1Input) -> Self {
        VerificationRequestData {
            context: value.context,
            subject_claims: value.subject_claims,
        }
    }
}

pub fn create_verification_request_v1_anchor(raw_input: JsonString) -> anyhow::Result<Vec<u8>> {
    let input: VerificationRequestV1Input = serde_json::from_str(&raw_input)?;
    let public = input.public_info.clone();
    let anchor = VerificationRequestData::from(input).to_anchor(public.map(|p| p.0));
    Ok(cbor_encode(&anchor)?)
}

pub fn compute_verification_request_v1_anchor_hash(
    raw_input: JsonString,
) -> anyhow::Result<Vec<u8>> {
    let input: VerificationRequestV1Input = serde_json::from_str(&raw_input)?;
    let public = input.public_info.clone();
    let anchor = VerificationRequestData::from(input).to_anchor(public.map(|p| p.0));
    Ok(anchor.hash.bytes.to_vec())
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerificationAuditV1Input {
    /// The verification audit record
    record: VerificationAuditRecord,
    /// The optional public info to register with the anchor.
    pub public_info: Option<PublicInfo>,
}

pub fn create_verification_audit_v1_anchor(raw_input: JsonString) -> anyhow::Result<Vec<u8>> {
    let input: VerificationAuditV1Input = serde_json::from_str(&raw_input)?;
    let public = input.public_info.clone();
    let anchor = input.record.to_anchor(public.map(|p| p.0));
    Ok(cbor_encode(&anchor)?)
}

/// Computes the hash of a verification audit v1 anchor.
/// Takes a JSON string containing the audit record and optional public info,
/// creates the anchor structure, and returns the anchor's hash bytes.
pub fn compute_verification_audit_v1_anchor_hash(raw_input: JsonString) -> anyhow::Result<Vec<u8>> {
    let input: VerificationAuditV1Input = serde_json::from_str(&raw_input)?;
    let public = input.public_info.clone();
    let anchor = input.record.to_anchor(public.map(|p| p.0));
    Ok(anchor.hash.bytes.to_vec())
}
