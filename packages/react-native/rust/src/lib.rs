//! Native wallet bindings for the React Native SDK.

use concordium_base::common::base16_encode_string;
use futures_channel::oneshot;
use key_derivation::{ConcordiumHdWallet, Net};
use serde_json::{json, Value};
use std::{
    sync::atomic::{AtomicUsize, Ordering},
    thread,
};

mod credential;
mod derivation;
mod presentation;
mod schema;
use wallet_library::identity::{
    create_identity_object_request_v1_aux, create_identity_recovery_request_aux,
};

uniffi::setup_scaffolding!();

#[derive(Debug, thiserror::Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum IdentityError {
    #[error("Expected a 64-byte seed encoded as hex")]
    InvalidSeed,
    #[error("Expected Mainnet or Testnet")]
    InvalidNetwork,
    #[error("Invalid identity request input: {0}")]
    InvalidInput(String),
    #[error("Could not derive the identity keys: {0}")]
    DerivationFailed(String),
    #[error("Could not create the identity request: {0}")]
    RequestFailed(String),
    #[error("Could not run the identity request on a background thread")]
    WorkerFailed,
    #[error("Could not generate a random seed")]
    RandomnessUnavailable,
    #[error("All native wallet workers are busy")]
    WorkerBusy,
    #[error("The native wallet operation failed")]
    OperationFailed,
    #[error("Invalid contract schema input: {0}")]
    SchemaFailed(String),
}

#[uniffi::export]
pub fn generate_identity_seed() -> Result<String, IdentityError> {
    let mut seed = [0u8; 64];
    getrandom::getrandom(&mut seed).map_err(|_| IdentityError::RandomnessUnavailable)?;
    Ok(hex::encode(seed))
}

#[uniffi::export]
pub async fn create_identity_request(
    seed: String,
    network: String,
    identity_index: u32,
    parameters_json: String,
) -> Result<String, IdentityError> {
    on_worker(move || build_request(&seed, &network, identity_index, &parameters_json)).await
}

#[uniffi::export]
pub async fn create_identity_request_with_keys(input: String) -> Result<String, IdentityError> {
    on_worker(move || issue(parse_input(&input)?)).await
}

#[uniffi::export]
pub async fn create_identity_recovery_request(
    seed: String,
    network: String,
    identity_index: u32,
    input: String,
) -> Result<String, IdentityError> {
    on_worker(move || build_recovery(&seed, &network, identity_index, &input)).await
}

#[uniffi::export]
pub async fn create_identity_recovery_request_with_keys(
    input: String,
) -> Result<String, IdentityError> {
    on_worker(move || recover(parse_input(&input)?)).await
}

fn build_recovery(
    seed: &str,
    network: &str,
    identity_index: u32,
    input: &str,
) -> Result<String, IdentityError> {
    let wallet = wallet(seed, network)?;
    let mut parameters = parse_input(input)?;
    let provider = provider_index(&parameters)?;
    let secret = wallet
        .get_id_cred_sec(provider, identity_index)
        .map_err(derivation_error)?;
    parameters.insert("idCredSec".into(), json!(base16_encode_string(&secret)));
    recover(parse_value(Value::Object(parameters))?)
}

fn recover(
    input: wallet_library::identity::IdentityRecoveryRequestInput,
) -> Result<String, IdentityError> {
    create_identity_recovery_request_aux(input).map_err(|_| IdentityError::OperationFailed)
}

fn issue(
    input: wallet_library::identity::IdentityObjectRequestInput,
) -> Result<String, IdentityError> {
    create_identity_object_request_v1_aux(input)
        .map_err(|error| IdentityError::RequestFailed(error.to_string()))
}

const MAX_WORKERS: usize = 4;
static ACTIVE_WORKERS: AtomicUsize = AtomicUsize::new(0);

struct WorkerSlot;

impl WorkerSlot {
    fn acquire() -> Result<Self, IdentityError> {
        ACTIVE_WORKERS
            .fetch_update(Ordering::Relaxed, Ordering::Relaxed, |active| {
                (active < MAX_WORKERS).then_some(active + 1)
            })
            .map_err(|_| IdentityError::WorkerBusy)?;
        Ok(Self)
    }
}

impl Drop for WorkerSlot {
    fn drop(&mut self) {
        ACTIVE_WORKERS.fetch_sub(1, Ordering::Relaxed);
    }
}

// Dropping a UniFFI future discards its result. A running crypto operation finishes
// on the Rust thread and holds its slot until completion.
async fn on_worker<T: Send + 'static>(
    work: impl FnOnce() -> Result<T, IdentityError> + Send + 'static,
) -> Result<T, IdentityError> {
    let slot = WorkerSlot::acquire()?;
    let (sender, receiver) = oneshot::channel();
    thread::Builder::new()
        .name("concordium-wallet".into())
        .spawn(move || {
            let result = work();
            drop(slot);
            let _ = sender.send(result);
        })
        .map_err(|_| IdentityError::WorkerFailed)?;
    receiver.await.map_err(|_| IdentityError::WorkerFailed)?
}

fn parse_input<T: serde::de::DeserializeOwned>(input: &str) -> Result<T, IdentityError> {
    serde_json::from_str(input)
        .map_err(|_| IdentityError::InvalidInput("unexpected JSON format".into()))
}

fn parse_value<T: serde::de::DeserializeOwned>(input: Value) -> Result<T, IdentityError> {
    serde_json::from_value(input)
        .map_err(|_| IdentityError::InvalidInput("unexpected JSON format".into()))
}

fn wallet(seed: &str, network: &str) -> Result<ConcordiumHdWallet, IdentityError> {
    let mut seed_bytes = [0; 64];
    hex::decode_to_slice(seed, &mut seed_bytes).map_err(|_| IdentityError::InvalidSeed)?;
    let net = network
        .parse::<Net>()
        .map_err(|_| IdentityError::InvalidNetwork)?;
    Ok(ConcordiumHdWallet {
        seed: seed_bytes,
        net,
    })
}

fn provider_index(parameters: &serde_json::Map<String, Value>) -> Result<u32, IdentityError> {
    parameters
        .get("ipInfo")
        .and_then(|info| info.get("ipIdentity"))
        .and_then(Value::as_u64)
        .and_then(|index| u32::try_from(index).ok())
        .ok_or_else(|| IdentityError::InvalidInput("ipInfo.ipIdentity must be a u32".into()))
}

fn derivation_error(error: key_derivation::DeriveError) -> IdentityError {
    IdentityError::DerivationFailed(error.to_string())
}

fn build_request(
    seed: &str,
    network: &str,
    identity_index: u32,
    parameters_json: &str,
) -> Result<String, IdentityError> {
    let wallet = wallet(seed, network)?;
    let mut parameters = parse_input(parameters_json)?;
    let provider_index = provider_index(&parameters)?;
    let id_cred_sec = wallet
        .get_id_cred_sec(provider_index, identity_index)
        .map_err(derivation_error)?;
    let prf_key = wallet
        .get_prf_key(provider_index, identity_index)
        .map_err(derivation_error)?;
    let blinding = wallet
        .get_blinding_randomness(provider_index, identity_index)
        .map_err(derivation_error)?;
    parameters.insert(
        "idCredSec".into(),
        json!(base16_encode_string(&id_cred_sec)),
    );
    parameters.insert("prfKey".into(), json!(base16_encode_string(&prf_key)));
    parameters.insert(
        "blindingRandomness".into(),
        json!(base16_encode_string(&blinding)),
    );

    issue(parse_value(Value::Object(parameters))?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use concordium_base::{
        common::Versioned,
        id::{
            constants::{ArCurve, IpPairing},
            identity_provider::{validate_id_recovery_request, validate_request_v1},
            types::{IdRecoveryRequest, IpContext, PreIdentityObjectV1},
        },
    };

    const RESOURCES: &str = "../../../deps/concordium-base/rust-src/wallet_library/resources/";

    fn fixture(file: &str) -> Value {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join(RESOURCES)
            .join(file);
        let value: Value = serde_json::from_reader(std::fs::File::open(path).unwrap()).unwrap();
        value["value"].clone()
    }

    #[test]
    fn native_request_passes_provider_verification() {
        let parameters = json!({
            "ipInfo": fixture("ip_info.json"),
            "arsInfos": fixture("ars_infos.json"),
            "globalContext": fixture("global.json"),
            "arThreshold": 2,
        });
        let seed = "ab".repeat(64);
        let response = build_request(&seed, "Testnet", 0, &parameters.to_string()).unwrap();
        let response: Value = serde_json::from_str(&response).unwrap();
        let request: Versioned<PreIdentityObjectV1<IpPairing, ArCurve>> =
            serde_json::from_value(response["idObjectRequest"].clone()).unwrap();
        assert_eq!(request.version, concordium_base::common::VERSION_0);

        let ip = serde_json::from_value(parameters["ipInfo"].clone()).unwrap();
        let ars = serde_json::from_value(parameters["arsInfos"].clone()).unwrap();
        let global = serde_json::from_value(parameters["globalContext"].clone()).unwrap();
        assert!(validate_request_v1(&request.value, IpContext::new(&ip, &ars, &global)).is_ok());
    }

    #[test]
    fn both_recovery_inputs_match_issuance_and_pass_provider_verification() {
        let seed = "ab".repeat(64);
        let parameters = json!({
            "ipInfo": fixture("ip_info.json"),
            "globalContext": fixture("global.json"),
            "timestamp": 1_722_939_941,
        });
        let mut issuance = parameters.clone();
        issuance["arsInfos"] = fixture("ars_infos.json");
        issuance["arThreshold"] = json!(2);
        let issued: Value = serde_json::from_str(
            &build_request(&seed, "Testnet", 0, &issuance.to_string()).unwrap(),
        )
        .unwrap();
        let derived = build_recovery(&seed, "Testnet", 0, &parameters.to_string()).unwrap();

        let provider = parameters["ipInfo"]["ipIdentity"].as_u64().unwrap() as u32;
        let mut explicit = parameters.clone();
        explicit["idCredSec"] = json!(base16_encode_string(
            &wallet(&seed, "Testnet")
                .unwrap()
                .get_id_cred_sec(provider, 0)
                .unwrap()
        ));
        let explicit = recover(parse_value(explicit).unwrap()).unwrap();

        let ip = serde_json::from_value::<concordium_base::id::types::IpInfo<IpPairing>>(
            parameters["ipInfo"].clone(),
        )
        .unwrap();
        let global = serde_json::from_value(parameters["globalContext"].clone()).unwrap();
        for response in [derived, explicit] {
            let response: Value = serde_json::from_str(&response).unwrap();
            let request: Versioned<IdRecoveryRequest<ArCurve>> =
                serde_json::from_value(response["idRecoveryRequest"].clone()).unwrap();
            assert_eq!(request.version, concordium_base::common::VERSION_0);
            assert_eq!(
                response["idRecoveryRequest"]["value"]["idCredPub"],
                issued["idObjectRequest"]["value"]["idCredPub"]
            );
            assert!(validate_id_recovery_request(&ip, &global, &request.value));
        }
    }

    #[test]
    fn workers_bound_concurrency_and_release_slots_after_cancellation() {
        use std::{
            future::Future,
            sync::{mpsc, Arc},
            task::{Context, Poll, Wake, Waker},
            time::Duration,
        };

        struct Notify(mpsc::Sender<()>);
        impl Wake for Notify {
            fn wake(self: Arc<Self>) {
                let _ = self.0.send(());
            }
        }

        let (notify, completed) = mpsc::channel();
        let waker = Waker::from(Arc::new(Notify(notify)));
        let mut cx = Context::from_waker(&waker);
        let mut blockers = Vec::new();
        for _ in 0..MAX_WORKERS {
            let (unblock, waiting) = mpsc::channel::<()>();
            let mut work = Box::pin(on_worker(move || {
                waiting.recv().unwrap();
                Ok(())
            }));
            assert!(work.as_mut().poll(&mut cx).is_pending());
            blockers.push((unblock, work));
        }
        let mut overflow = Box::pin(on_worker(|| Ok(())));
        assert!(matches!(
            overflow.as_mut().poll(&mut cx),
            Poll::Ready(Err(IdentityError::WorkerBusy))
        ));

        let (unblock, cancelled) = blockers.pop().unwrap();
        drop(cancelled);
        let mut next = Box::pin(on_worker(|| Ok(())));
        assert!(matches!(
            next.as_mut().poll(&mut cx),
            Poll::Ready(Err(IdentityError::WorkerBusy))
        ));
        unblock.send(()).unwrap();

        for (unblock, mut work) in blockers {
            unblock.send(()).unwrap();
            loop {
                if let Poll::Ready(result) = work.as_mut().poll(&mut cx) {
                    result.unwrap();
                    break;
                }
                completed.recv_timeout(Duration::from_secs(2)).unwrap();
            }
        }
        let mut next = Box::pin(on_worker(|| Ok("result")));
        assert_ne!(
            next.as_mut().poll(&mut cx).map(|value| value.ok()),
            Poll::Ready(None)
        );
        // A cancelled receiver does not block other jobs from completing.
    }

    #[test]
    fn malformed_seed_error_omits_the_seed() {
        let error = build_request("bad seed", "Testnet", 0, "{}").unwrap_err();
        assert!(matches!(error, IdentityError::InvalidSeed));
        assert!(!error.to_string().contains("bad seed"));
    }
}

#[uniffi::export]
pub fn generate_mnemonic_entropy() -> Result<Vec<u8>, IdentityError> {
    let mut entropy = vec![0; 32];
    getrandom::getrandom(&mut entropy).map_err(|_| IdentityError::RandomnessUnavailable)?;
    Ok(entropy)
}
