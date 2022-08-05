import { createIdentityRequest, IdentityRequestInput } from '../src/identity';
import fs from 'fs';

test('idrequest', () => {
    const ipInfo = JSON.parse(
        fs.readFileSync('./test/resources/ip_info.json').toString()
    ).value;
    const globalContext = JSON.parse(
        fs.readFileSync('./test/resources/global.json').toString()
    ).value;
    const arsInfos = JSON.parse(
        fs.readFileSync('./test/resources/ars_infos.json').toString()
    ).value;
    const seed =
        'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';

    const input: IdentityRequestInput = {
        ipInfo,
        globalContext,
        arsInfos,
        seed,
        net: 'Testnet',
        identityIndex: 0,
        arThreshold: 1,
    };
    const output = createIdentityRequest(input).value;
    const output2 = createIdentityRequest(input).value;
    expect(typeof output.proofsOfKnowledge).toBe('string');
    expect(output.idCredPub).toEqual(output2.value.idCredPub);
});
