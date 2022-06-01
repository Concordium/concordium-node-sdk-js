import { deserializeContractState } from '../src/deserialization';
import { Buffer } from 'buffer/';

test('test that deserializeContractState works', () => {
    const state = deserializeContractState(
        'PiggyBank',
        Buffer.from(
            'AQAAAAkAAABQaWdneUJhbmsBFQIAAAAGAAAASW50YWN0AgcAAABTbWFzaGVkAgAAAAAA',
            'base64'
        ),
        Buffer.from('00', 'hex')
    );

    expect(state.Intact).toBeDefined();
});
