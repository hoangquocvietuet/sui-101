import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import dotenv from "dotenv";

dotenv.config();

const client = new SuiClient({
  url: "https://fullnode.testnet.sui.io:443",
});

async function main() {
    const objectData = await client.getObject({
        id: "0xc9f52fddffc201236559dff57426f5781192aff3bdac4e9fae3d95e2ee0182ec",
        options: {
            showContent: true,
        },
    });

    console.log((objectData.data?.content as any).fields);
}

async function shareHero() {
    const PACKAGE_ID = "0x046b67518d6b6c35a97c05e1924baeac09c418b0e72eb1a775fb973fd070f8c7";
    const pk = process.env.PRIVATE_KEY;
    const tx = new Transaction();
    const sword = tx.moveCall({
        target: `${PACKAGE_ID}::sword::sword_create`,
        typeArguments: [],
        arguments: [
            tx.pure.u64(42),
            tx.pure.u64(7)
        ],
    });
    const hero_with_sword = tx.moveCall({
        target: `${PACKAGE_ID}::hero::new_hero`,
        typeArguments: [],
        arguments: [sword],
    });
    tx.moveCall({
        target: `${PACKAGE_ID}::hero::share_hero`,
        arguments: [hero_with_sword],
    })

    const res = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: Ed25519Keypair.fromSecretKey(pk!),
    });

    console.log(res);
}

async function attack() {
    const PACKAGE_ID = "0x046b67518d6b6c35a97c05e1924baeac09c418b0e72eb1a775fb973fd070f8c7";
    const pk = process.env.PRIVATE_KEY;
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::hero::attack`,
        typeArguments: [],
        arguments: [tx.object("0xc9f52fddffc201236559dff57426f5781192aff3bdac4e9fae3d95e2ee0182ec")],
    });

    const res = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: Ed25519Keypair.fromSecretKey(pk!),
    });

    console.log(res);
}

main();

// attack();

// shareHero();