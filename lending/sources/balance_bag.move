module lending::balance_bag;

use std::type_name::{Self, TypeName};
use sui::bag::{Bag, Self};
use sui::coin::{Self, Coin};
use sui::tx_context::TxContext;
use sui::vec_map::{Self, VecMap};
use sui::balance::{Self, Balance};

#[test_only]
use sui::test_scenario;

const EInsufficientBalance: u64 = 0;

public struct BalanceBag has store {
    balances: VecMap<TypeName, u64>,
    bag: Bag,
}

public fun new(ctx: &mut TxContext): BalanceBag {
    BalanceBag {
        balances: vec_map::empty<TypeName, u64>(),
        bag: bag::new(ctx),
    }
}

public fun add_to_bag<T>(balance_bag: &mut BalanceBag, coin: Coin<T>, ctx: &mut TxContext) {
    let type_name = type_name::get<T>();
    // check contains
    if (!vec_map::contains(&balance_bag.balances, &type_name)) {
        vec_map::insert(&mut balance_bag.balances, type_name, 0);
        balance_bag.bag.add<TypeName, Balance<T>>(type_name, balance::zero<T>());
    };
    let mut current_balance = balance_bag.bag.borrow_mut<TypeName, Balance<T>>(type_name);
    coin::put(current_balance, coin);
    balance_bag.balances.remove(&type_name);
    if (current_balance.value() != 0) {
        balance_bag.balances.insert(type_name, current_balance.value());
    };
}

public fun remove_from_bag<T>(balance_bag: &mut BalanceBag, amount: u64, ctx: &mut TxContext): Coin<T> {
    let type_name = type_name::get<T>();
    let mut current_balance = balance_bag.bag.borrow_mut<TypeName, Balance<T>>(type_name);
    let split_balance = current_balance.split(amount);
    let return_coin = coin::from_balance(split_balance, ctx);
    balance_bag.balances.remove(&type_name);
    if (current_balance.value() != 0) {
        balance_bag.balances.insert(type_name, current_balance.value());
    };
    return_coin
}

public fun get_balance(balance_bag: &BalanceBag, type_name: TypeName): u64 {
    *balance_bag.balances.get(&type_name)
}

public fun get_balances(balance_bag: &BalanceBag): VecMap<TypeName, u64> {
    balance_bag.balances
}

// #[test]
// fun test_add_to_bag() {
//     let test_scenario = test_scenario::begin(@0x1);
//     let ctx = test_scenario.ctx();
// }