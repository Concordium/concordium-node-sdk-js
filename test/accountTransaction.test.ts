import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    SimpleTransfer,
} from "../src/types";
import * as ed from "noble-ed25519";
import { getAccountTransactionSignDigest } from "../src/serialization";
import { sha256 } from "../src/hash";
import getNodeClient from "./testHelpers";

const client = getNodeClient();
const senderAccountAddress =
    "4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M";

test("send transaction signed with wrong private key is accepted", async () => {
    const simpleTransfer: SimpleTransfer = {
        amount: 100n,
        toAddress: "4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf",
    };

    const { nonce } = await client.getNextAccountNonce(senderAccountAddress);
    const header: AccountTransactionHeader = {
        expiry: BigInt(
            Math.floor(new Date(Date.now() + 3600000).getTime() / 1000)
        ),
        nonce: nonce,
        sender: senderAccountAddress,
    };

    const simpleTransferAccountTransaction: AccountTransaction = {
        header: header,
        payload: simpleTransfer,
        type: AccountTransactionType.SimpleTransfer,
    };

    const wrongPrivateKey =
        "ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c";

    const hashToSign = getAccountTransactionSignDigest(
        simpleTransferAccountTransaction,
        sha256
    );
    const signature = Buffer.from(
        await ed.sign(hashToSign, wrongPrivateKey)
    ).toString("hex");
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        simpleTransferAccountTransaction,
        signatures
    );
    expect(result).toBeTruthy();
});

test("send transaction signed with expiry too far into the future is rejected", async () => {
    const simpleTransfer: SimpleTransfer = {
        amount: 100n,
        toAddress: "4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf",
    };

    const { nonce } = await client.getNextAccountNonce(senderAccountAddress);
    const header: AccountTransactionHeader = {
        expiry: 2225279747n,
        nonce: nonce,
        sender: senderAccountAddress,
    };

    const simpleTransferAccountTransaction: AccountTransaction = {
        header: header,
        payload: simpleTransfer,
        type: AccountTransactionType.SimpleTransfer,
    };

    const wrongPrivateKey =
        "ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c";

    const hashToSign = getAccountTransactionSignDigest(
        simpleTransferAccountTransaction,
        sha256
    );
    const signature = Buffer.from(
        await ed.sign(hashToSign, wrongPrivateKey)
    ).toString("hex");
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        simpleTransferAccountTransaction,
        signatures
    );
    expect(result).toBeFalsy();
});
