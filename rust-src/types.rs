use ps_sig::SigRetrievalRandomness;
use crypto_common::{*};
use curve_arithmetic::{Curve, Pairing};
use id::types::*;

#[derive(SerdeSerialize, SerdeDeserialize)]
#[serde(bound(
    serialize = "P: Pairing",
    deserialize = "P: Pairing"
))]
pub struct RandomnessWrapper<P: Pairing> {
    #[serde(
        rename = "randomness",
        serialize_with = "base16_encode",
        deserialize_with = "base16_decode"
    )]
    pub randomness: SigRetrievalRandomness<P>,
}

#[derive(SerdeSerialize, SerdeDeserialize)]
#[serde(untagged)]
pub enum BlockItem<
        P: Pairing,
    C: Curve<Scalar = P::ScalarField>,
    AttributeType: Attribute<C::Scalar>,
    > {
    Deployment (AccountCredentialMessage<P, C, AttributeType>)
}

impl<
        P: Pairing,
    C: Curve<Scalar = P::ScalarField>,
    AttributeType: Attribute<C::Scalar>,
    > Serial for BlockItem<P, C, AttributeType> {
    fn serial<B: Buffer>(&self, out: &mut B) {
        match self {
            BlockItem::Deployment(deployment) => {
                out.write_u8(1).expect("Writing to buffer should succeed.");
                deployment.serial(out);
            }
        }
    }
}
