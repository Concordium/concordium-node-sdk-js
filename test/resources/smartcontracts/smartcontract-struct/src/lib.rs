//! dcb bank smart contract.
//!
//! Allows anyone to insert GTU, but only the owner can "smash" it and
//! retrieve the GTU. Prevents more GTU to be inserted after being smashed.
//!
//! This smart contract module is developed as part of a upcoming tutorial on
//! developing smart contracts.
//!
//! Covers:
//! - Reading owner, sender and self_balance from the context.
//! - The `ensure` macro.
//! - The `payable` attribute.
//! - Creating a simple transfer action.

// Pulling in everything from the smart contract standard library.
use concordium_std::*;

// Types
type StringArray = [String; 4];

/// Type of the parameter to the `init` function.
#[derive(Serialize, SchemaType)]
struct UserDetails {
    age: u8,
    name: String,
    city: String,
    country: String,
    nicknames: StringArray
}

/// The state of the dcb bank
#[derive(Debug, Serialize, PartialEq, Eq)]
enum DCBBankState {
    /// Alive and well, allows for GTU to be inserted.
    Intact,
    /// The dcb bank has been emptied, preventing further GTU to be inserted.
    Smashed,
}

/// Setup a new Intact dcb bank.
#[init(contract = "SampleContract1", parameter = "UserDetails")]
fn dcb_init(_ctx: &impl HasInitContext) -> InitResult<UserDetails> {
    let tokens: UserDetails = _ctx.parameter_cursor().get()?;
        Ok(tokens)
}

/// Insert some GTU into a dcb bank, allowed by anyone.
#[receive(contract = "SampleContract1", name = "insertAmount", payable, parameter = "u8")]
fn dcb_insert<A: HasActions>(
    _ctx: &impl HasReceiveContext,
    _amount: Amount,
    state: &mut DCBBankState,
) -> ReceiveResult<A> {
    // Ensure the dcb bank has not been smashed already.
    ensure!(*state == DCBBankState::Intact);
    // Just accept since the GTU balance is managed by the chain.
    Ok(A::accept())
}

/// Insert some GTU into a dcb bank, allowed by anyone.
#[receive(contract = "SampleContract1", name = "insertAmount1", payable, parameter = "UserDetails")]
fn dcb_insert1<A: HasActions>(
    _ctx: &impl HasReceiveContext,
    _amount: Amount,
    state: &mut DCBBankState,
) -> ReceiveResult<A> {
    // Ensure the dcb bank has not been smashed already.
    ensure!(*state == DCBBankState::Intact);
    // Just accept since the GTU balance is managed by the chain.
    Ok(A::accept())
}

/// Insert some GTU into a dcb bank, allowed by anyone.
#[receive(contract = "SampleContract1", name = "insertAmount2", payable, parameter = "String")]
fn dcb_insert2<A: HasActions>(
    _ctx: &impl HasReceiveContext,
    _amount: Amount,
    state: &mut DCBBankState,
) -> ReceiveResult<A> {
    // Ensure the dcb bank has not been smashed already.
    ensure!(*state == DCBBankState::Intact);
    // Just accept since the GTU balance is managed by the chain.
    Ok(A::accept())
}

/// Insert some GTU into a dcb bank, allowed by anyone.
#[receive(contract = "SampleContract1", name = "insertAmount3", payable, parameter = "StringArray")]
fn dcb_insert3<A: HasActions>(
    _ctx: &impl HasReceiveContext,
    _amount: Amount,
    state: &mut DCBBankState,
) -> ReceiveResult<A> {
    // Ensure the dcb bank has not been smashed already.
    ensure!(*state == DCBBankState::Intact);
    // Just accept since the GTU balance is managed by the chain.
    Ok(A::accept())
}

/// Insert some GTU into a dcb bank, allowed by anyone.
#[receive(contract = "SampleContract1", name = "insertAmount4", payable, parameter = "i32")]
fn dcb_insert4<A: HasActions>(
    _ctx: &impl HasReceiveContext,
    _amount: Amount,
    state: &mut DCBBankState,
) -> ReceiveResult<A> {
    // Ensure the dcb bank has not been smashed already.
    ensure!(*state == DCBBankState::Intact);
    // Just accept since the GTU balance is managed by the chain.
    Ok(A::accept())
}
