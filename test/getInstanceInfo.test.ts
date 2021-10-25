import { getNodeClient } from './testHelpers';
const client = getNodeClient();

// test getInstanceInfo
test('retrieve information about a given smart contract instance', async () => {
    const blockHash =
        '6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def';
    const contractAddress = { subindex: 0, index: 5 };
    const accountInfo = await client.GetInstanceInfo(
        blockHash,
        contractAddress
    );
    console.log(accountInfo);
    return;
});

// test getInstances
test('retrieve the addresses of all smart contract instances', async () => {
    const blockHash =
        'b3866a64e2b2e845c766e12aa0ee48a40c3a04c420a2727f675e4e1558b50a1c';

    const accountInfo = await client.GetInstances(blockHash);
    console.log(accountInfo);
    return;
});
