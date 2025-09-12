module advanced_sui::hero;

use advanced_sui::sword::{Self, Sword, sword_create};

public struct Hero has key {
    id: UID,
    sword: Sword,
}

public fun new_hero(sword: Sword, ctx: &mut TxContext): Hero {
    Hero {
        id: object::new(ctx),
        sword: sword,
    }
}

public fun new_hero_with_sword(ctx: &mut TxContext): Hero {
    let sword = sword_create(42, 7, ctx);
    new_hero(sword, ctx)
}

public fun share_hero(hero: Hero) {
    transfer::share_object(hero);
}

public fun share_new_hero_with_sword(ctx: &mut TxContext) {
    let hero = new_hero_with_sword(ctx);
    share_hero(hero);
}

public fun attack(hero: &mut Hero) {
    hero.sword.attack();
}