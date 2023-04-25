import { AccountAddress } from '../src';
import { generateBakerKeys } from '../src/accountHelpers';

test('generate baker keys', () => {
    const accountAddress = '3eP94feEdmhYiPC1333F9VoV31KGMswonuHk5tqmZrzf761zK5';
    const keys = generateBakerKeys(new AccountAddress(accountAddress));
    expect(typeof keys.signatureVerifyKey).toBe('string');
    expect(typeof keys.electionVerifyKey).toBe('string');
    expect(typeof keys.aggregationVerifyKey).toBe('string');
    expect(typeof keys.signatureSignKey).toBe('string');
    expect(typeof keys.electionPrivateKey).toBe('string');
    expect(typeof keys.aggregationSignKey).toBe('string');
    expect(typeof keys.proofAggregation).toBe('string');
    expect(typeof keys.proofSig).toBe('string');
    expect(typeof keys.proofElection).toBe('string');
});
