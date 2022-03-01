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

/// The state of the dcb bank
#[derive(Debug, Serialize, PartialEq, Eq, SchemaType)]
enum DCBBankState {
    /// Alive and well, allows for GTU to be inserted.
    Intact = 0,
    /// The dcb bank has been emptied, preventing further GTU to be inserted.
    Smashed
}

// Types
#[derive(Serialize, SchemaType)]
enum Message {
    /// Indicates that the user sending the message would like to make a request
    // to send funds to the given address with the given ID and amount.
    // This is a no-op if the given ID already exists and has not timed out.
    RequestTransfer(TransferRequestId, Amount),
}

type TransferRequestId = u64;

/// Setup a new Intact dcb bank.
#[init(contract = "ComplexEnum2",  parameter = "Message")]
fn dcb_init(_ctx: &impl HasInitContext) -> InitResult<DCBBankState> {

   let msg: Message = _ctx.parameter_cursor().get()?;
    // Always succeeds
    Ok(DCBBankState::Intact)
    
}

/// Insert some GTU into a dcb bank, allowed by anyone.
#[receive(contract = "ComplexEnum2", name = "insertAmount", payable, parameter = "u8")]
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

/// Smash a dcb bank retrieving the GTU, only allowed by the owner.
#[receive(contract = "ComplexEnum2", name = "smashAmount")]
fn dcb_smash<A: HasActions>(
    ctx: &impl HasReceiveContext,
    state: &mut DCBBankState,
) -> ReceiveResult<A> {
    // Get the contract owner, i.e. the account who initialized the contract.
    let owner = ctx.owner();
    // Get the sender, who triggered this function, either a smart contract or
    // an account.
    let sender = ctx.sender();

    // Ensure only the owner can smash the dcb bank.
    ensure!(sender.matches_account(&owner));
    // Ensure the dcb bank has not been smashed already.
    ensure!(*state == DCBBankState::Intact);
    // Set the state to be smashed.
    *state = DCBBankState::Smashed;

    // Get the current balance of the smart contract.
    let balance = ctx.self_balance();
    // Result in a transfer of the whole balance to the contract owner.
    Ok(A::simple_transfer(&owner, balance))
}
