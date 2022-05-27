import { deserializeContractState } from '../src/deserialization';
import { Buffer } from 'buffer/';

test('fail account transaction serialization if no signatures', () => {
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
