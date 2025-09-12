/*
/// Module: nft
module nft::nft;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

module nft::nft;

use std::string::String;
use sui::display::{Display, Self};
use sui::package::{Self, Publisher};

public struct Sui101 has key, store, copy, drop {
    id: UID,
    name: String,
    image_url: String,
    description: String,
    creator: String,
}

public struct NFT has drop {}

fun init(witness: NFT, ctx: &mut TxContext) {
    let keys = vector[
        b"name".to_string(),
        b"image_url".to_string(),
        b"description".to_string(),
        b"creator".to_string(),
    ];

    let values = vector[
        // For `name` one can use the `Hero.name` property
        b"{name}".to_string(),
        // For `image_url` use an IPFS template + `image_url` property.
        b"https://picsum.photos/1000".to_string(),
        // Description is static for all `Hero` objects.
        b"A true Sui101 of the Sui ecosystem!".to_string(),
        // Creator field can be any
        b"{creator}".to_string(),
    ];

    // Claim the `Publisher` for the package!
    let publisher = package::claim(witness, ctx);

    // Get a new `Display` object for the `Hero` type.
    let mut display = display::new_with_fields<Sui101>(
        &publisher, keys, values, ctx
    );

    // Commit first version of `Display` to apply changes.
    display.update_version();

    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(display, ctx.sender());
}

public fun mint_and_transfer(ctx: &mut TxContext) {
    let nft = mint(ctx); 
    transfer::transfer(nft, ctx.sender());
}

public fun mint_and_return_nft(ctx: &mut TxContext): Sui101 {
    let nft = mint(ctx);
    nft
}

fun mint(ctx: &mut TxContext): Sui101 {
    let nft = Sui101 {
        id: object::new(ctx),
        name: b"Sui101".to_string(),
        image_url: b"https://picsum.photos/1000".to_string(),
        description: b"A true Sui101 of the Sui ecosystem!".to_string(),
        creator: ctx.sender().to_string(),
    };
    nft
}