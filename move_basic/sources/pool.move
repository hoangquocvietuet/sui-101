public struct Pool  {
}

public struct Position {
}

fun init() {
    let pool = Pool {};
    transfer::public_share(pool);

    let position = Position {};
    transfer::public_transfer(position, tx_context::sender(ctx));
}

