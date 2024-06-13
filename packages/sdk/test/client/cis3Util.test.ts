import { CIS3, deserializeCIS3Event, deserializeCIS3EventsFromSummary } from '../../src/cis3/util.js';
import { AccountAddress, BlockItemSummary, ContractEvent, TransactionHash } from '../../src/index.js';
import { getNodeClientV2 } from './testHelpers.js';

const TRANSACTION_HASH = TransactionHash.fromHexString(
    'bbbb4dbac785210092ccbe3692d166b858bb0edc05068c2346a0446d05d3695b'
);
const SPONSOREE = AccountAddress.fromBase58('4NgCvVSCuCyHkALqbAnSX3QEC7zrfoZbig7X3ePMpk8iLod6Yj');

async function getBlockItemSummary(): Promise<BlockItemSummary> {
    const nodeClient = getNodeClientV2();
    const bi = await nodeClient.waitForTransactionFinalization(TRANSACTION_HASH);
    return bi.summary;
}

test('CIS3 nonce events are deserialized correctly', async () => {
    const bi = await getBlockItemSummary();
    const events = deserializeCIS3EventsFromSummary(bi);
    const expected: CIS3.NonceEvent = {
        type: CIS3.EventType.Nonce,
        nonce: 0n,
        sponsoree: SPONSOREE,
    };
    expect(events).toStrictEqual([expected]);
});

test('Custom CIS3 events are deserialized correctly', async () => {
    const data = Uint8Array.from([249, 1, 2, 3]);
    const event = ContractEvent.fromBuffer(data);
    const deserializedCustomEvent = deserializeCIS3Event(event);
    const expectedDeserializedCustomEvent: CIS3.CustomEvent = {
        type: CIS3.EventType.Custom,
        data,
    };
    expect(deserializedCustomEvent).toEqual(expectedDeserializedCustomEvent);
});
