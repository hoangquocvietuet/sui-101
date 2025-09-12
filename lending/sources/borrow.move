module lending::borrow;

use sui::vec_map::VecMap;
use std::type_name::TypeName;
use sui::coin::Coin;
use sui::tx_context::TxContext;
use sui::object::UID;
use lending::lend::LendRegistry;
use lending::oracle::OracleRegistry;
use sui::clock::Clock;
use pyth::price_info::PriceInfoObject;

public struct BorrowRegistry has key {
    id: UID,
    borrow_balance: VecMap<address, VecMap<TypeName, u64>>,
}

public fun borrow<T>(
    lend_registry: &LendRegistry,
    oracle_registry: &OracleRegistry,
    borrow_registry: &mut BorrowRegistry,
    amount: u64,
    clock: &Clock,
    price_info_object: &PriceInfoObject,
    ctx: &mut TxContext,
): Coin<T> {
    let supply_balances = lend_registry.get_supply_balances(ctx.sender());
    // loop over the map
    let i = 0;
    let mut total_value = 0;
    while (i < supply_balances.size()) {
        let (type_name, balance) = supply_balances.get_entry_by_idx(i);
        let price = oracle_registry.get_price( clock, price_info_object, *type_name);
        if (price.get_is_negative()) {
            total_value = total_value + price.get_magnitude_if_positive() * balance;
        } else {
            total_value = total_value + price.get_magnitude_if_positive() * balance;
        };
        i = i + 1;
    };
    total_value
}

#[test]
fun test_borrow() {
    
}