//! ind bank smart contract.
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

/// The state of the ind bank
#[derive(Debug, Serialize, PartialEq, Eq)]
enum INDBankState {
    /// Alive and well, allows for GTU to be inserted.
    Intact,
    /// The ind bank has been emptied, preventing further GTU to be inserted.
    Smashed,
}

/// Setup a new Intact ind bank.
#[init(contract = "INDBank")]
fn ind_init(_ctx: &impl HasInitContext) -> InitResult<INDBankState> {
    // Always succeeds
    Ok(INDBankState::Intact)
}

/// Insert some GTU into a ind bank, allowed by anyone.
#[receive(contract = "INDBank", name = "insertAmount", payable)]
fn ind_insert<A: HasActions>(
    _ctx: &impl HasReceiveContext,
    _amount: Amount,
    state: &mut INDBankState,
) -> ReceiveResult<A> {
    // Ensure the ind bank has not been smashed already.
    ensure!(*state == INDBankState::Intact);
    // Just accept since the GTU balance is managed by the chain.
    Ok(A::accept())
}

/// Smash a ind bank retrieving the GTU, only allowed by the owner.
#[receive(contract = "INDBank", name = "smashAmount")]
fn ind_smash<A: HasActions>(
    ctx: &impl HasReceiveContext,
    state: &mut INDBankState,
) -> ReceiveResult<A> {
    // Get the contract owner, i.e. the account who initialized the contract.
    let owner = ctx.owner();
    // Get the sender, who triggered this function, either a smart contract or
    // an account.
    let sender = ctx.sender();

    // Ensure only the owner can smash the ind bank.
    ensure!(sender.matches_account(&owner));
    // Ensure the ind bank has not been smashed already.
    ensure!(*state == INDBankState::Intact);
    // Set the state to be smashed.
    *state = INDBankState::Smashed;

    // Get the current balance of the smart contract.
    let balance = ctx.self_balance();
    // Result in a transfer of the whole balance to the contract owner.
    Ok(A::simple_transfer(&owner, balance))
}

/// Get the balance of the ind bank, only allowed by the owner.
#[receive(contract = "INDBank", name = "balanceOf")]
fn ind_balance_of<A: HasActions> (
    ctx: &impl HasReceiveContext,
    _state: &mut INDBankState,
) -> ReceiveResult<A> { 
    // Get the contract owner, i.e. the account who initialized the contract.
    let owner = ctx.owner();
    // Get the sender, who triggered this function, either a smart contract or
    // an account.
    let sender = ctx.sender();

    // Ensure only the owner can smash the ind bank.
    ensure!(sender.matches_account(&owner));

    // Get the current balance of the smart contract.
    let balance = ctx.self_balance();
    // Result in a transfer of the whole balance to the contract owner.
    Ok(A::simple_transfer(&owner, balance))
}