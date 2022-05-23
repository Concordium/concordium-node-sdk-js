use std::collections::*;

use concordium_std::*;

#[derive(SchemaType, Serialize)]
enum AnotherEnum {
    F,
    X,
}

#[derive(SchemaType, Serialize)]
enum SomeEnum {
    A,
    B(AnotherEnum),
    C {
        c1: ContractAddress,
        c2: u128,
    },
}

#[derive(SchemaType, Serialize)]
struct SomeStruct {
    first_field:  [OwnedReceiveName; 2],
    second_field: Vec<i8>,
    third_field:  i128,
}

#[derive(SchemaType, Serialize, PartialOrd, PartialEq, Ord, Eq)]
struct AnotherStruct {
    a: i128,
    b: u8,
}

#[derive(SchemaType, Serialize)]
struct SomeLargeStruct {
    s_bool:             bool,
    s_u8:               u8,
    s_u16:              u16,
    s_u32:              u32,
    s_u64:              u64,
    s_u128:             u128,
    s_i8:               i8,
    s_i16:              i16,
    s_i32:              i32,
    s_i64:              i64,
    s_i128:             i128,
    s_amount:           Amount,
    s_account_address:  AccountAddress,
    s_contract_address: ContractAddress,
    s_timestamp:        Timestamp,
    s_duration:         Duration,
    s_pair:             (ContractAddress, u64),
    s_list:             Vec<ContractAddress>,
    s_set:              BTreeSet<AnotherStruct>,
    s_map:              BTreeMap<i8, AnotherStruct>,
    s_array:            [(Vec<Timestamp>, Duration); 2],
    s_struct:           SomeStruct,
    s_enum:             SomeEnum,
    s_string:           String,
    s_contract_name:    OwnedContractName,
    s_receive_name:     OwnedReceiveName,
}

#[contract_state(contract = "schema-test")]
type State = SomeLargeStruct;

#[init(contract = "schema-test", parameter = "State")]
fn contract_init(ctx: &impl HasInitContext) -> InitResult<State> {
    let parameter = ctx.parameter_cursor().get()?;
    Ok(parameter)
}
