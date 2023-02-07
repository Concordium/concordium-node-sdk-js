import { AccountAddress } from '../src';
import { generateBakerKeys } from '../src/bakerHelpers';

test('generate baker keys', async () => {
    const accountAddress = '3eP94feEdmhYiPC1333F9VoV31KGMswonuHk5tqmZrzf761zK5';
    const signature = await generateBakerKeys(
        new AccountAddress(accountAddress)
    );
    expect(typeof signature.signatureVerifyKey).toBe('string');
    expect(typeof signature.electionVerifyKey).toBe('string');
    expect(typeof signature.aggregationVerifyKey).toBe('string');
    expect(typeof signature.proofAggregation).toBe('string');
    expect(typeof signature.proofSig).toBe('string');
    expect(typeof signature.proofElection).toBe('string');
});
