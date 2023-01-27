import { Dropdown } from 'react-bootstrap';
import { Network } from '@concordium/react-components';
import { useCallback } from 'react';

interface Props {
    selected: Network;
    options: Array<Network>;
    select: (n: Network) => void;
}

export function NetworkSelector({ selected, options, select }: Props) {
    const onSelect = useCallback((key: any) => select(options[key as number]), [options, select]);
    return (
        <Dropdown onSelect={onSelect}>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
                Network: {selected.name}
            </Dropdown.Toggle>
            <Dropdown.Menu>
                {options.map((n, idx) => (
                    <Dropdown.Item key={idx} eventKey={idx}>
                        {n.name}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
}
