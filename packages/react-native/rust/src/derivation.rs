use super::{wallet, IdentityError};
use wallet_library::wallet::*;

#[derive(uniffi::Record)]
pub struct WalletSeed {
    pub seed: String,
    pub network: String,
}

#[derive(uniffi::Record)]
pub struct IdentityPath {
    pub provider: u32,
    pub index: u32,
}

#[derive(uniffi::Record)]
pub struct CredentialIssuer {
    pub index: u64,
    pub subindex: u64,
}

fn derive(
    seed: WalletSeed,
    f: impl FnOnce(String, &str) -> anyhow::Result<String>,
) -> Result<Vec<u8>, IdentityError> {
    // Validate before passing the seed to shared routines that may report input values.
    wallet(&seed.seed, &seed.network)?;
    let key = f(seed.seed, &seed.network)
        .map_err(|_| IdentityError::DerivationFailed("invalid derivation input".into()))?;
    hex::decode(key).map_err(|_| IdentityError::OperationFailed)
}

macro_rules! derive_key {
    ($name:ident, $aux:ident $(, $argument:ident: $ty:ty => [$($value:expr),+] )*) => {
        #[uniffi::export]
        pub fn $name(seed: WalletSeed, $($argument: $ty),*) -> Result<Vec<u8>, IdentityError> {
            derive(seed, |seed, network| $aux(seed, network, $($($value),+,)*))
        }
    }
}

derive_key!(get_account_signing_key, get_account_signing_key_aux,
    path: IdentityPath => [path.provider, path.index], counter: u32 => [counter]);
derive_key!(get_account_public_key, get_account_public_key_aux,
    path: IdentityPath => [path.provider, path.index], counter: u32 => [counter]);
derive_key!(get_credential_id, get_credential_id_aux,
    path: IdentityPath => [path.provider, path.index], counter: u8 => [counter], commitment_key: String => [&commitment_key]);
derive_key!(get_prf_key, get_prf_key_aux, path: IdentityPath => [path.provider, path.index]);
derive_key!(get_id_cred_sec, get_id_cred_sec_aux, path: IdentityPath => [path.provider, path.index]);
derive_key!(get_signature_blinding_randomness, get_signature_blinding_randomness_aux,
    path: IdentityPath => [path.provider, path.index]);
derive_key!(get_attribute_commitment_randomness, get_attribute_commitment_randomness_aux,
    path: IdentityPath => [path.provider, path.index], counter: u32 => [counter], attribute: u8 => [attribute]);
derive_key!(get_verifiable_credential_signing_key, get_verifiable_credential_signing_key_aux,
    issuer: CredentialIssuer => [issuer.index, issuer.subindex], counter: u32 => [counter]);
derive_key!(get_verifiable_credential_public_key, get_verifiable_credential_public_key_aux,
    issuer: CredentialIssuer => [issuer.index, issuer.subindex], counter: u32 => [counter]);
derive_key!(
    get_verifiable_credential_backup_encryption_key,
    get_verifiable_credential_backup_encryption_key_aux
);

/// Generates a test fixture and discards the private validator keys in Rust.
#[uniffi::export]
pub async fn generate_validator_key_fixture(account: String) -> Result<String, IdentityError> {
    super::on_worker(move || {
        let sender = account
            .parse()
            .map_err(|_| IdentityError::InvalidInput("invalid account address".into()))?;
        let (_, payload) =
            concordium_rust_bindings_wallet::aux_functions::generate_baker_key_pairs(sender);
        serde_json::to_string(&payload).map_err(|_| IdentityError::OperationFailed)
    })
    .await
}
