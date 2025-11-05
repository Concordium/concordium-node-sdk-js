use anyhow::Result;
use concordium_base::{
    id::{
        constants::{ArCurve, IpPairing},
        types::GlobalContext,
    },
    web3id::{v1, Web3IdAttribute},
};

pub fn create_presentation(
    request: v1::RequestV1<ArCurve, Web3IdAttribute>,
    global: GlobalContext<ArCurve>,
    inputs: Vec<v1::CredentialProofPrivateInputs<IpPairing, ArCurve, Web3IdAttribute>>,
) -> Result<v1::PresentationV1<IpPairing, ArCurve, Web3IdAttribute>> {
    let presentation = request.prove(&global, inputs.into_iter())?;
    Ok(presentation)
}
