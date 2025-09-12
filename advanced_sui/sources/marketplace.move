module advanced_sui::marketplace {

    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use 0x1::option::{Self, Option};

    public struct Listing<T> has key, store {
        id: UID,
        seller: address,
        price_in_sui: u64,
        object: Option<T>,
    }

    public fun sale<T>(nft: T, price_in_sui: u64, ctx: &mut TxContext) {
        let listing = Listing {
            id: object::new(ctx),
            seller: tx_context::sender(ctx),
            price_in_sui,
            object: option::some(nft),
        };
        transfer::share_object(listing);
    }

    public fun buy<T>(listing: &mut Listing<T>, mut payment: Coin<SUI>, ctx: &mut TxContext): T {
        let price = listing.price_in_sui;
        let payment_value = coin::value(&payment);
        assert!(payment_value >= price, 0);

        // Nếu dư thì refund
        if (payment_value > price) {
            let refund = coin::split(&mut payment, payment_value - price, ctx);
            transfer::public_transfer(refund, tx_context::sender(ctx));
        };

        // Phần còn lại chính xác bằng price → chuyển cho seller
        transfer::public_transfer(payment, listing.seller);

        // Lấy NFT ra
        let nft = option::extract(&mut listing.object);
        nft
    }
}