/// Module: oracle
module lending::oracle;
 
use sui::clock::Clock;
use pyth::price_info;
use pyth::price_identifier;
use pyth::price;
use pyth::i64::I64;
use pyth::pyth;
use pyth::price_info::PriceInfoObject;
use sui::vec_map::VecMap;
use std::type_name::{Self, TypeName};
 
const E_INVALID_ID: u64 = 1;

public struct OracleRegistry has key {
    id: UID,
    price_feed_ids: VecMap<TypeName, vector<u8>>,
}

public fun get_price(
    registry: &OracleRegistry,
    clock: &Clock,
    price_info_object: &PriceInfoObject,
    type_name: TypeName,
): I64 {
    let max_age = 60;
 
    // Make sure the price is not older than max_age seconds
    let price_struct = pyth::get_price_no_older_than(price_info_object, clock, max_age);
 
    // Check the price feed ID
    let price_info = price_info::get_price_info_from_price_info_object(price_info_object);
    let price_id = price_identifier::get_bytes(&price_info::get_price_identifier(&price_info));
 
    let expected_price_id = registry.price_feed_ids.get(&type_name);
    assert!(price_id == expected_price_id, E_INVALID_ID);
 
    // Extract the price, decimal, and timestamp from the price struct and use them.
    let _decimal_i64 = price::get_expo(&price_struct);
    let price_i64 = price::get_price(&price_struct);
    let _timestamp_sec = price::get_timestamp(&price_struct);
 
    price_i64
}

public fun add_price_feed_id(
    registry: &mut OracleRegistry,
    type_name: TypeName,
    price_feed_id: vector<u8>,
) {
    registry.price_feed_ids.insert(type_name, price_feed_id);
}