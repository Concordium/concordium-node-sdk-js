import { TokenGovernanceOperation, TokenTransferOperation } from './types.js';

export function tokenOperationCbor<O extends TokenTransferOperation | TokenGovernanceOperation>({
    type,
    ...value
}: O): { [K in O['type']]: Omit<O, 'type'> } {
    return { [type]: value } as { [K in O['type']]: Omit<O, 'type'> };
}
