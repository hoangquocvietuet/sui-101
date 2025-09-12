public struct ACL has copy {
    admin
    operator
    hr
    user
    // 
}

public struct Admin has key {
    id: UID,
}

fun init() {
    transfer::public_transfer(Admin { id: object::new() }, ctx.sender());
}

public fun set_fee(admin: &Admin, fee: u64) {

}