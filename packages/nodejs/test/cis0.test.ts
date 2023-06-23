import { CIS0, cis0Supports } from '@concordium/common-sdk';
import { getNodeClientV2 as getNodeClient } from './testHelpers';

const client = getNodeClient();

test('cis0Supports', async () => {
    const result = await cis0Supports(
        client,
        { index: 3496n, subindex: 0n },
        'CIS-0'
    );
    expect(result?.type).toEqual(CIS0.SupportType.Support);

    const resultMulti = await cis0Supports(
        client,
        { index: 3496n, subindex: 0n },
        ['CIS-0', 'CIS-2']
    );

    resultMulti
        ?.map((r) => expect(r.type))
        .forEach((e) => e.toEqual(CIS0.SupportType.Support));

    const resultCIS1 = await cis0Supports(
        client,
        { index: 3496n, subindex: 0n },
        'CIS-1'
    );
    expect(resultCIS1?.type).toEqual(CIS0.SupportType.NoSupport);

    const resultArb = await cis0Supports(
        client,
        { index: 3496n, subindex: 0n },
        'NON-STANDARD-ID-123'
    );
    expect(resultArb?.type).toEqual(CIS0.SupportType.NoSupport);
});

test('cis0Supports throws on non cis-0', async () => {
    const result = await cis0Supports(
        client,
        { index: 3494n, subindex: 0n },
        'CIS-0'
    );
    expect(result).toBe(undefined);
});
