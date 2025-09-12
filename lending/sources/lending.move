/*
/// Module: lending
module lending::lending;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

module lending::lend;

use lending::balance_bag::{Self, BalanceBag};
use sui::coin::Coin;
use sui::object::UID;
use sui::tx_context::TxContext;
use sui::vec_map::VecMap;
use std::type_name::{Self, TypeName};

public struct LendRegistry has key {
    id: UID,
    supply_balance: VecMap<address, BalanceBag>,
}

public fun supply<T>(registry: &mut LendRegistry, coin: Coin<T>, ctx: &mut TxContext) {
    let sender = ctx.sender();

    if (!registry.supply_balance.contains(&sender)) {
        registry.supply_balance.insert(sender, balance_bag::new(ctx));
    };
    registry.supply_balance.get_mut(&sender).add_to_bag(coin, ctx);
}

public fun withdraw<T>(registry: &mut LendRegistry, amount: u64, ctx: &mut TxContext): Coin<T> {
    let sender = ctx.sender();
    let coin = registry.supply_balance.get_mut(&sender).remove_from_bag(amount, ctx);
    coin
}

public fun get_supply_balances(registry: &LendRegistry, sender: address): VecMap<TypeName, u64> {
    let balances = registry.supply_balance.get(&sender).get_balances();
    balances
}
