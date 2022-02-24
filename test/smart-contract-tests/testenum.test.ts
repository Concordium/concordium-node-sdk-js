import { serializeInitContractParameters } from '../../src/serialization';
import {
    deserialModuleFromBuffer,
    getModuleBuffer,
} from '../../src/deserializeSchema';

test('Parameter of U128 with the wrong private key', async () => {
    enum DCBBankState {
        /// Alive and well, allows for GTU to be inserted.
        Intact = 1,
        /// The dcb bank has been emptied, preventing further GTU to be inserted.
        Smashed,
    }

    const userInput = { Intact: [DCBBankState.Intact] };
    const contractName = 'SimpleEnum';

    const modulefileBuffer = getModuleBuffer(
        '/home/omkarsunku/concordium-rust-smart-contracts/examples/piggy-bank/part32/schema.bin'
    );
    console.log([userInput]);
    const inputParams = serializeInitContractParameters(
        contractName,
        userInput,
        modulefileBuffer
    );
    const getSchemaModule = deserialModuleFromBuffer(modulefileBuffer);
    console.log(getSchemaModule);
});
