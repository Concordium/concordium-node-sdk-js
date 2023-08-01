import {
    SendTransactionInitContractPayload,
    SendTransactionPayload,
    SendTransactionUpdateContractPayload,
} from '@concordium/browser-wallet-api-helpers';
import {
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    BigintFormatType,
    ContractName,
    CredentialStatements,
    EntrypointName,
    InitContractPayload,
    Parameter,
    UpdateContractPayload,
    VerifiablePresentation,
    getTransactionKindString,
    jsonUnwrapStringify,
    serializeInitContractParameters,
    serializeTypeValue,
    serializeUpdateContractParameters,
    toBuffer,
} from '@concordium/web-sdk';
import { WalletConnectModal, WalletConnectModalConfig } from '@walletconnect/modal';
import { MobileWallet } from '@walletconnect/modal-core';
import SignClient from '@walletconnect/sign-client';
import { ISignClient, ProposalTypes, SessionTypes, SignClientTypes } from '@walletconnect/types';
import { CONCORDIUM_WALLET_CONNECT_PROJECT_ID, MAINNET, TESTNET } from '.';
import {
    Network,
    Schema,
    SignableMessage,
    TypedSmartContractParameters,
    WalletConnection,
    WalletConnectionDelegate,
    WalletConnector,
} from './WalletConnection';
import { UnreachableCaseError } from './error';

const WALLET_CONNECT_SESSION_NAMESPACE = 'ccd';

/**
 * Describes the possible methods to invoke
 */
export enum WalletConnectMethod {
    SignAndSendTransaction = 'sign_and_send_transaction',
    SignMessage = 'sign_message',
    RequestVerifiablePresentation = 'request_verifiable_presentation',
}

/**
 * Describes the possible events to listen to
 */
export enum WalletConnectEvent {
    ChainChanged = 'chain_changed',
    AccountsChanged = 'accounts_changed',
}

/**
 * Describes a mobile wallet to connect to through a wallet connect modal.
 */
export type WalletConnectModalMobileWallet = MobileWallet & {
    /** Url for an icon to represent the wallet */
    iconUrl?: string;
};

/**
 * Concordium mainnet wallet for mobile described as {@linkcode WalletConnectModalMobileWallet}
 */
export const CONCORDIUM_WALLET_MAINNET = {
    id: 'ConcordiumMainet',
    name: 'Concordium Wallet',
    links: {
        native: 'concordiumwallet://',
    },
    iconUrl:
        'data:image/webp;base64,UklGRhYJAABXRUJQVlA4WAoAAAAIAAAA9QAA9QAAVlA4IJAIAADwNwCdASr2APYAPpVKmUejIqEU2wQoNAlE9Ld+Pizr+LYWxZS/TBwLdH/K6W0R2gHuBnEX9aexL/V+gdjmAc/GkRS1VumIAPqd6Bfuvmh9edZ2MnaC/rbgdjbmZmZmZmZmZmZmZmZmZmbIZmTyXTucuirhRPGoAfpkGImqqt/3YwASWFmyG/bP9A39oE5zptUrEnIUEPxyb10xsoP3VDW/cPDwzQGMQhPiKDZ/AXJqcA+3qvnRGhVvjzWO38+JZONxLAMSQln7oacp/aGkTP2CI7U//o7VM3pR4MfkbVoOIXAsGwxsynfeCnsnsY8iVDG7KHQosBfI/xrvmdCADpYcI6NG6Jd3sQqZzsYKzIvGarc+4jFmxKnQEkcpfIZUXieXjQT64aW7tr6Vcy+BC7BftL5EN7fDuWTcCh9xPy5oX3jpEyxNGPwoCbL5y2fMA05eDBANchp+zkopFSdgf5a+S6wS5+W5s8tpOsnBgTnAcI9q0uOTEwCjYSa10TYoZpDhXAih5wReIWxxtS51BN4r9t/r+3XAjLG6TB2p8JLlG360tlj26fz2nHbnIgAAAAKIzOg/60pkb+lEZnQV5b5WU7TjXD68QwAA/vS/wEnP/oMKreuAAAAA/WfNc36Y3zMAAAAA2UAO1xjKXsqNaC5HPIM3yNL+BQ8hQt+wxmwpHDKIc3UouEzyT2lywAHIsI8P/5fMoHSq1d5n+dlw8xmDXlr7XrHtkc25rz2ueWwnEYFwfKQaJgoR1kCrRAABtudYDWl5aMRIA2UlZ0bSWrzjlb/mgBql8N3jfgtVK4F3OI2JOw+DqPiRdEjGz8i0AvNomL3KcwP3L7zRmfp2HGZvCYuhR8jyCtWUBABLg6wCm0TkgxpRApBKS5IClkhuF/UnCWUhq5ntDP+oTZlUVCq4qL6A19+rk9AJ6ox/aGKLuCJE/Sys9oJHTWk7bbd2AK+7W+E1x7PDdFRmteme1WcuX5ZW5gSJ/JSuCWT55kLBz3i0JwvcuNtgWif0fPNSB71IEXXsv7Dl0TvZtfItF+V/MljUPJMvk7qqEnsFFcUeYVgT+253x6Lbg2NB+hEdDDCd3b7FIpqYFKB++q3vmLwxDMQH6e5OROxmjWieruIQ9y9uWvkTpoqCvPL10PIDL8NihCdI4ZS293VL7GW2ld4AZeGtrgczeIWwwRRfJMtiRk9hp5SguQCzK6hE2j0i2+MP05g3l0HsvgYLU+OSaLslG9i+oWCVizfJvxSJx6guQQWEfBWPZBi8Y5TwaPKPCD2f74wtejTEeLdmzFg7KAE6ZqSeQPi+cN3rzS+NdGQA+3F7HQKapSmgVJWJ+HPc7WEv9cEIn2i6NNMunpgLp+ZrFpQDqjyWVplxH2n1+lrMiwOJVTTubzRTMAMSP/kkT3tj9LmfHpF7qI+scitZetxN1QTM8NG5zr8fX/UVU/HolSx2YXqIXV5wi/mCGIU7eXZoGxLSeHULMMKZ7c2UmZaE643Tl5HCaO2Ri5lFYbMkwPqqKL33tLVb2Tycl0nQyzihq1M7aVT6KVIDnxDPrCDjEOUI5zsmvqniV0Qp2bPq8frtn/KrhV3sP/L4E7LMM/jcwr5y6yghSOvBDAfLsjgJf7lfwMayafHmmiP+Zj5lz8mtCt8esQm2i1gQrcoziKfYKmGO8qycD9hkNFi5IBEz2J1VMQNkbnTz0ysgf1WSsrxDkhwSHqNcOZAD22Xy7L2IcwqWTTZRxmhOWlp5OP8JkMI2prkoojZ1JbrPRexFlg+2ZFWeBdgxc5OhGqLoL1mnISRyRfZkdugOnxnIB/SiCxhA51Uw4RaE/mVsMsMxt8jQB9/WGWlQ0LBkaCvsdSIBwsKIge6OPK1rvR6N7L/YU0VmHIsjRvO2SBympDY/yS5V4CETf8+0TfGnIo2J1oLqD3BbuZB25s7yTMLtmESRtLB5HbuGhnRjf4Gi69a0ziESm543hKe3+nQiD/jcjXw8VTLb5oe+jIBOpledmLdHXug0OOcSqjoh4GCDN8cka29NCHpxJNhsO0+CTNcIfGBTnvVG2L6SH4QLgVOLsZryT1lungAz2S6V7Yhk3iGHFi1jBZYKwfyNbs0u0S+uYBEl6hhYoobezYRHLlZx+kMEv09+YgDR/056s6m4VjzRhi32AfkbeJnrfX3UEfCbNOBH8xIExiEeU0M2WNfHD0wbEuG3NVB/sqdSAp+jaTYr0TCP6oYjw7opj7NdNfwekPkuyvK5g1x2ijisTDPVh2+ppc8o6//M/EbOi2BP3L2l15/dm/hi1EC51FSzUmrJUkY+v6E8zoT04p124JMHLamYtii9kiVyIx+YDFlHA+UiXH6OtXFo4+sdwUe7kyfaEnTV/7lwShO+U2fPYeJ8e8wQ1iHSMKOYhWaakW+v7wspz2hqgJ4ZiRE5yHobn90KASZBSoxhSFB2mnQSot3UYqpyzonnlyPHSwQ/tmr+P0k+QFMmhreH0APbWTVrLhWLyWx0iVEMQZqG8deFJnUzafelQ/fQKq72PnHlvjZycEw+A2FbPxtc/lyh3OWzh5gMd9vkqVBMUU4tnXS6GDRdqNtRxtzeKw4BwTtfIxsxFJl9t+njZV3GsS+1TRSb5grO9xX84n96SD+YS/GmK9WTdcRLRcvE+nc9KskXTMjD4X4i4aiJE0tzYdngR4870RCRJVSdsWT3lR8U/6q73Ftl/NMG/JoLK28WyADmuj4wLLxchOBptE+cFjRw7Syp4lZdT2a4dZ8yKL6drDCwAQ5Hd+JMSvTck3HvV7OHnG1HJNhYyBKbTsN7eSzry1JxztqGVOxxS9dt1gv3QL0kb/G3KtbxgNfLxS0orOw2Ck3FA0W73AFKAovPp7n2sr4gFItAPoKQIK6uC6gHlvqjZgj3wrT2dgfgY09Sx8oQ/Cdt6TgAAEVYSUZfAAAASUkqAAgAAAABAGmHBAABAAAAGgAAAAAAAAABAIaSBwAyAAAALAAAAAAAAABBU0NJSQAAADEuNzIuMC0yM0otTkFRQkZIMlE3Tk9OQU80QldBN1pHQ05WTUkuMC4yLTkA',
} satisfies WalletConnectModalMobileWallet;

/**
 * Concordium testnet wallet for mobile described as {@linkcode WalletConnectModalMobileWallet}
 */
export const CONCORDIUM_WALLET_TESTNET = {
    id: 'ConcordiumTestnet',
    name: 'Concordium Wallet (Testnet)',
    links: {
        native: 'concordiumwallettest://',
    },
    iconUrl:
        'data:image/webp;base64,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',
} satisfies WalletConnectModalMobileWallet;

/**
 * CryptoX mainnet wallet for mobile described as {@linkcode WalletConnectModalMobileWallet}
 */
export const CRYPTO_X_WALLET_MAINNET = {
    id: 'CryptoXMainnet',
    name: 'CryptoX Wallet',
    links: {
        native: 'cryptox://',
    },
    iconUrl:
        'data:image/webp;base64,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',
} satisfies WalletConnectModalMobileWallet;

/**
 * CryptoX testnet wallet for mobile described as {@linkcode WalletConnectModalMobileWallet}
 */
export const CRYPTO_X_WALLET_TESTNET = {
    id: 'CryptoXTestnet',
    name: 'CryptoX Wallet (Testnet)',
    links: {
        native: 'cryptoXStage://',
    },
    iconUrl:
        'data:image/webp;base64,UklGRq4IAABXRUJQVlA4WAoAAAAIAAAA9QAA9QAAVlA4ICgIAAAQOgCdASr2APYAPpVKoEkjIqOSyUxoPAlE9LdwtsRcx/9gEtbFXvJX9o7XP8ry3Exkinwu7z+AF+K/03dWQAfVX0QplKp3QA8Pf6o8/X1n7B/RmGuEjujA2X94H9Ils4eF/eB/TLc1bMOYHponzYnW45tSVbKO4s6aWDbnZBN8etJtH6RwKvug93bxlxPcj46z4/joqBPQeDnhb/V5/qjNeRkPPUHB7yb9N5wUCGnBATC8NnVBCY+A6kfon3gc6wFKZLzZe74G3EGkWnsvHeB+1vbOAXnGDl2WrZY184H2KkfqjNeSoAyzI9bkAKXW8RdUglOxcqDgkw2HdFoFe1gf39eUH2ZcHmWqaEEC5Q4zwqksQgadEONzedgasd2q0UCiLbZiPyuLP79FTWFSDveMUrcgA7Rk2bV+ifeCn8NvX8QVPVu6YRhgPGc+umJoz3u0zP7+c1OXBPhgbX9Xs70D70p/2A/7P91eHdkPWNYB+LpPGMmfeH6LmrWyE+uv8ABHOCEyupPOX1P3GtTGrNUmeP1QaaxV3wb27lEhZ5AVG94m9djgcCF6RwIyAKmE4Frmzhdf7AUkxK3hSpwU9eCp4ddjWvHxA1JH6p6zh4X5DR+qes4eF/eBGAD+/GOOD0ClKcAAAqRdPxubKr/L584gM2R1GGUPwp6dQs3fqadFiNS0+UXHk48GXr/0CA1vPw94tlA/jDnPSJDk6HOAAsSyiUDWyNiAZjhMzhwR1ihKcRvC6+5pZKddwGBppAqmkWV7DxF3fBR9A5Eu/M2jHwlFef+hNvWyPtYroh/q+C/WB6QfX+YxIQAjlZO4N22KbvhaxdAU9d3+yT8RCH68Xg1kXsBu1OdDF1ZKKWK1HjY4uDphi24Y85fjkMRsI+DK6o4r//pgutNgWmCHHMU6mAk4WoR5asz6VBUnJyDq6VYEh7roO4KlLvj0JYmuaD/7k5hBxI1dOXYaeW+wn0Lw856iR7QxYE/0lMgxY6THgo4r3izH6XkipF6ydVm19gJVO+aRBSdgeTiXSb+4jIIms4+iCE1Q8WCt55wrccLop7D1irdreS1BXi6HOxOUmuAygrDzr0oamrmtdwtJT21j29wZLQVRj+80zwjnBv74jwL7ufMlKZTqB3BlsFMbZRHNc9PcP3qR1Hh5vib2Uta8DY05nmmK7KVT4oAmdEYxgWsX8dT1pw0L2zicxRti2UsL7WkSJDc1mtZeeO60ZryALGtlG4neZN/hl2UICIOEh7RHDGv+qOKgJ3aHGPoyA3Lb13L4S8YdcPX44qMPskuduOyHRXgY+jHBw58b0eYbYQSPvpqgfZnSDHkTvCoq9KcHlrmM1268HUGMpBZLpaXoptD5sBWWWZdjgDrrwIbbWq8KxqdkJQbmWU6DesSHDRnoYjaHgXU944Q/02sILCdeIrK/PZHqb1LhcSvN6nhr/YuZybtHMhitfcV+q4ULdjO3TZ0CwtofxNgtKy0z/kzPlrJjSKQyR/oGBdTqLwoBWv5M7An4/oho1b4L0x+gu2gg/mV6T4HJK5dQtyUDzIBUhxfY8bpGOYvkfo3t0ksmG4acz9QJyqcDWwKOjYDtjDwrTz3OQ3OMsZe3GEQ19KHURtuMAsuy97OTzkpMnBrsC8jr2carFvkqs0Y33HGHMHyTbC7YDm5Vsd+BZUIoas5mIiWPUsAxHZ6e3rbbipZflMaAYrigtjfMr0+JMz0qn2AADshftyWH2YERoTT4f67ghSXth68jTZfZyEZ4bBvgo+h/tNWlfzVwgjDTfuEe6xvhzNe4URmp8J2KnxfvspQcRpF9viYYbwf2qkupDhAiPB2XEF5YX6gJqzTCLW/KGN/sCzh0xUP1WTroYsrIUJ/Mwxi/MYPjzAG8DhZNMP/MBw0rhhSt9hx7f8iKgPchSVXEk1jGCzq0vF47tCTFGILFlWa+b4FfEoLrMt6FBK6NKs44+rc78jmgE7fyuKRAS6TtJM8MfSQ0BrODb+W9mEmOqkgTFZWdXcy9YjCCLY1XE2NghV2+HvOnYYsjFh8X25QJJnn3G3JFv3plL0h1IaDVM++QwdqTN9fVD6myV3HOqfUVr0uSK/x6R34xMWDnpYtmM31i2O09aFpm1+v7SXi5va1wc1bgMr0z+CZVIrYg2WsObb8j/I4QKag/VHKIL0uh+vl3k4diQdUgK5OCwkMNswEd/Cj5ZobjWUWVp57tmFL3KMUAHXHs2u/ppJe8Exq7Z/OD4icEULC4A3LgBiZdwPtslgwZKjE2k+HuY/bcQalvgkzthgPUD18YwA+JsSBjt4Kie5j3vgMSwuLCqbKVGfiobimvXFFlWyH1YDQuAITt43hv4K9zIktCZtcQZVJsLD1qoKrZjb3eI+BxYIQNqKN5f8esUE4QdamfUZwLAEOpKKg7q8y9FCm8I361uViycyCX8UhJggyEWLhrnSqQ+jJ/dySd+u6CbimALEYV8+Z+XIT9ZYEf+l7iJEoVxIeKMX8wvhKKVeSgsfo4gRjjNbXfZl8zX+V8mlCTL42h4pFJuSDYQbOP4IEwDkhm0U4CiI30x5PlSM+qE4AWC2CStLSvsObBc7wff1zWNdkAjzKvh03fe/NTVaBFo5da3Mz5i3ppXGIPVphrUIu98U62QNTfberbnpekvG5HP/glYaXO1NqOfjeTt4gUD1Ue+d0OjqGmil1Wot7ueZX48je6PPbGtP1EgCILadHi5Y3XaHGhIy4jUhhIh0TOl4mYkeqyfiTUliyB8Ua+1uMmsxzYkMAAzEfAcoAAAABFWElGXwAAAElJKgAIAAAAAQBphwQAAQAAABoAAAAAAAAAAQCGkgcAMgAAACwAAAAAAAAAQVNDSUkAAAAxLjcyLjEtMjNKLUlBTkxVTzVVT0FTQTNSU0U1UFhCVDRQNkdFLjAuMi01AA==',
} satisfies WalletConnectModalMobileWallet;

const DEFAULT_MOBILE_WALLETS = {
    [TESTNET.name]: [CONCORDIUM_WALLET_TESTNET, CRYPTO_X_WALLET_TESTNET],
    [MAINNET.name]: [CONCORDIUM_WALLET_MAINNET, CRYPTO_X_WALLET_MAINNET],
};

/**
 * Creates a {@linkcode WalletConnectModalConfig}.
 *
 * @param network The {@linkcode Network} to connect to.
 * @param [mobileWallets] The list of mobile wallets to use for deep linking. Defaults to the concordium and cryptoX wallets for mobile for the specified `network`.
 * If `network` is anything but {@linkcode MAINNET} or {@linkcode TESTNET}, the default value is an empty list.
 * @param [enableExplorer] Whether to enable the wallet connect explorer in the wallet connect modal. Defaults to `false`.
 *
 * @returns the corresponding {@linkcode WalletConnectModalConfig}
 */
export function createWalletConnectModalConfig(
    network: Network,
    mobileWallets: WalletConnectModalMobileWallet[] = DEFAULT_MOBILE_WALLETS[network.name] ?? [],
    enableExplorer = false
): WalletConnectModalConfig {
    let walletImages: Record<string, string> | undefined;
    const mws: MobileWallet[] = [];

    mobileWallets.forEach(({ iconUrl, ...wallet }) => {
        mws.push(wallet);
        if (iconUrl !== undefined) {
            walletImages = walletImages ?? {};
            walletImages[wallet.name] = iconUrl;
        }
    });

    return {
        projectId: CONCORDIUM_WALLET_CONNECT_PROJECT_ID,
        chains: [getChainId(network)],
        mobileWallets: mws,
        desktopWallets: [],
        explorerRecommendedWalletIds: 'NONE',
        explorerExcludedWalletIds: 'ALL',
        walletImages,
        enableExplorer,
    };
}

async function connect(
    client: ISignClient,
    namespaceConfig: ProposalTypes.RequiredNamespace,
    cancel: () => void,
    modalConfig: WalletConnectModalConfig
) {
    let modal: WalletConnectModal | undefined;

    try {
        const { uri, approval } = await client.connect({
            requiredNamespaces: {
                ccd: namespaceConfig,
            },
        });
        let response: SessionTypes.Struct | undefined = undefined;
        if (uri) {
            modal = new WalletConnectModal(modalConfig);
            modal.subscribeModal(({ open }) => {
                if (!open && response === undefined) {
                    cancel();
                }
            });

            // Open modal as we're not connecting to an existing pairing.
            await modal.openModal({ uri });
        }

        response = await approval();
        return response;
    } catch (e) {
        // Ignore falsy errors.
        if (e) {
            console.error(`WalletConnect client error: ${e}`);
        }
        cancel();
    } finally {
        modal?.closeModal();
    }
}

interface SignAndSendTransactionResult {
    hash: string;
}

interface SignAndSendTransactionError {
    code: number;
    message: string;
}

function isSignAndSendTransactionError(obj: any): obj is SignAndSendTransactionError {
    return 'code' in obj && 'message' in obj;
}

function accountTransactionPayloadToJson(data: AccountTransactionPayload) {
    return jsonUnwrapStringify(data, BigintFormatType.Integer, (_key, value) => {
        if (value?.type === 'Buffer') {
            // Buffer has already been transformed by its 'toJSON' method.
            return toBuffer(value.data).toString('hex');
        }
        return value;
    });
}

function serializeInitContractParam(
    contractName: ContractName.Type,
    typedParams: TypedSmartContractParameters | undefined
): Parameter.Type {
    if (!typedParams) {
        return Parameter.empty();
    }
    const { parameters, schema } = typedParams;
    switch (schema.type) {
        case 'ModuleSchema':
            return serializeInitContractParameters(contractName, parameters, schema.value, schema.version);
        case 'TypeSchema':
            return serializeTypeValue(parameters, schema.value);
        default:
            throw new UnreachableCaseError('schema', schema);
    }
}

function serializeUpdateContractMessage(
    contractName: ContractName.Type,
    entrypointName: EntrypointName.Type,
    typedParams: TypedSmartContractParameters | undefined
): Parameter.Type {
    if (!typedParams) {
        return Parameter.empty();
    }
    const { parameters, schema } = typedParams;
    switch (schema.type) {
        case 'ModuleSchema':
            return serializeUpdateContractParameters(
                contractName,
                entrypointName,
                parameters,
                schema.value,
                schema.version
            );
        case 'TypeSchema':
            return serializeTypeValue(parameters, schema.value);
        default:
            throw new UnreachableCaseError('schema', schema);
    }
}

/**
 * Convert schema into the object format expected by the Mobile crypto library (function 'parameter_to_json')
 * which decodes the parameter before presenting it to the user for approval.
 * @param schema The schema object.
 */
function convertSchemaFormat(schema: Schema | undefined) {
    if (!schema) {
        return null;
    }
    switch (schema.type) {
        case 'ModuleSchema':
            return {
                type: 'module',
                value: schema.value.toString('base64'),
                version: schema.version,
            };
        case 'TypeSchema':
            return {
                type: 'parameter',
                value: schema.value.toString('base64'),
            };
        default:
            throw new UnreachableCaseError('schema', schema);
    }
}

/**
 * Serialize parameters into appropriate payload field ('payload.param' for 'InitContract' and 'payload.message' for 'Update').
 * This payload field must be not already set as that would indicate that the caller thought that was the right way to pass them.
 * @param type Type identifier of the transaction.
 * @param payload Payload of the transaction. Must not include the fields 'param' and 'message' for transaction types 'InitContract' and 'Update', respectively.
 * @param typedParams Contract invocation parameters and associated schema. May be provided optionally provided for transactions of type 'InitContract' or 'Update'.
 */
function serializePayloadParameters(
    type: AccountTransactionType,
    payload: SendTransactionPayload,
    typedParams: TypedSmartContractParameters | undefined
): AccountTransactionPayload {
    switch (type) {
        case AccountTransactionType.InitContract: {
            const initContractPayload = payload as InitContractPayload;
            if (initContractPayload.param) {
                throw new Error(`'param' field of 'InitContract' parameters must be empty`);
            }
            return {
                ...payload,
                param: serializeInitContractParam(initContractPayload.initName, typedParams),
            } as InitContractPayload;
        }
        case AccountTransactionType.Update: {
            const updateContractPayload = payload as UpdateContractPayload;
            if (updateContractPayload.message) {
                throw new Error(`'message' field of 'Update' parameters must be empty`);
            }
            const [contractName, entrypointName] = updateContractPayload.receiveName.value.split('.');
            return {
                ...payload,
                message: serializeUpdateContractMessage(
                    ContractName.fromString(contractName),
                    EntrypointName.fromString(entrypointName),
                    typedParams
                ),
            } as UpdateContractPayload;
        }
        default: {
            if (typedParams) {
                throw new Error(`'typedParams' must not be provided for transaction of type '${type}'`);
            }
            return payload as Exclude<
                SendTransactionPayload,
                SendTransactionInitContractPayload | SendTransactionUpdateContractPayload
            >;
        }
    }
}

/**
 * Convert {@link SignableMessage} into the object format expected by the Mobile Wallets.
 * As of this writing, the Android wallet only supports the {@link StringMessage} variant.
 * @param msg The message to be signed.
 */
function convertSignableMessageFormat(msg: SignableMessage) {
    switch (msg.type) {
        case 'StringMessage': {
            return { message: msg.value };
        }
        case 'BinaryMessage': {
            return { message: msg.value.toString('hex'), schema: msg.schema.value.toString('base64') };
        }
        default:
            throw new UnreachableCaseError('message', msg);
    }
}

/**
 * Implementation of {@link WalletConnection} for WalletConnect v2.
 *
 * While WalletConnect doesn't set any restrictions on the amount of accounts and networks/chains
 * that can be associated with a single connection,
 * this implementation assumes that there is at least one and always use only the first one in the list.
 *
 * It also assumes that the network/chain is fixed to the one provided to {@link WalletConnector}.
 */
export class WalletConnectConnection implements WalletConnection {
    readonly connector: WalletConnectConnector;

    readonly chainId: string;

    session: SessionTypes.Struct;

    constructor(connector: WalletConnectConnector, chainId: string, session: SessionTypes.Struct) {
        this.connector = connector;
        this.chainId = chainId;
        this.session = session;
    }

    getConnector() {
        return this.connector;
    }

    async ping() {
        const { topic } = this.session;
        await this.connector.client.ping({ topic });
    }

    /**
     * @return The account that the wallet currently associates with this connection.
     */
    getConnectedAccount() {
        // We're only expecting a single account to be connected.
        const fullAddress = this.session.namespaces[WALLET_CONNECT_SESSION_NAMESPACE].accounts[0];
        return fullAddress.substring(fullAddress.lastIndexOf(':') + 1);
    }

    async signAndSendTransaction(
        accountAddress: string,
        type: AccountTransactionType,
        payload: SendTransactionPayload,
        typedParams?: TypedSmartContractParameters
    ) {
        const params = {
            type: getTransactionKindString(type),
            sender: accountAddress,
            payload: accountTransactionPayloadToJson(serializePayloadParameters(type, payload, typedParams)),
            schema: convertSchemaFormat(typedParams?.schema),
        };
        try {
            const { hash } = (await this.connector.client.request({
                topic: this.session.topic,
                request: {
                    method: 'sign_and_send_transaction',
                    params,
                },
                chainId: this.chainId,
            })) as SignAndSendTransactionResult; // TODO do proper type check
            return hash;
        } catch (e) {
            if (isSignAndSendTransactionError(e) && e.code === 500) {
                throw new Error('transaction rejected in wallet');
            }
            throw e;
        }
    }

    async signMessage(accountAddress: string, msg: SignableMessage) {
        const connectedAccount = this.getConnectedAccount();
        if (accountAddress !== connectedAccount) {
            throw new Error(
                `cannot sign message with address '${accountAddress}' on connection for account '${connectedAccount}'`
            );
        }
        const params = convertSignableMessageFormat(msg);
        const signature = await this.connector.client.request({
            topic: this.session.topic,
            request: {
                method: 'sign_message',
                params,
            },
            chainId: this.chainId,
        });
        return signature as AccountTransactionSignature; // TODO do proper type check
    }

    async requestVerifiablePresentation(
        challenge: string,
        credentialStatements: CredentialStatements
    ): Promise<VerifiablePresentation> {
        const paramsJson = jsonUnwrapStringify({ challenge, credentialStatements });
        const params = { paramsJson };
        const result = await this.connector.client.request<{ verifiablePresentationJson: string }>({
            topic: this.session.topic,
            request: {
                method: 'request_verifiable_presentation',
                params,
            },
            chainId: this.chainId,
        });
        return VerifiablePresentation.fromString(result.verifiablePresentationJson);
    }

    async disconnect() {
        await this.connector.client.disconnect({
            topic: this.session.topic,
            reason: {
                code: 1,
                message: 'user disconnecting',
            },
        });
        this.connector.onDisconnect(this);
    }
}

function getChainId({ name }: Network): string {
    return `${WALLET_CONNECT_SESSION_NAMESPACE}:${name}`;
}

/**
 * Describes the configuration of a connection to a wallet through wallet connect
 */
export type WalletConnectNamespaceConfig = {
    /** Which methods to request permission for */
    methods: WalletConnectMethod[];
    /** Which events to request permission for */
    events: WalletConnectEvent[];
};

export const FULL_WALLET_CONNECT_NAMESPACE_CONFIG: WalletConnectNamespaceConfig = {
    methods: [
        WalletConnectMethod.SignMessage,
        WalletConnectMethod.SignAndSendTransaction,
        WalletConnectMethod.RequestVerifiablePresentation,
    ],
    events: [WalletConnectEvent.AccountsChanged, WalletConnectEvent.ChainChanged],
};

/**
 * Implementation of {@link WalletConnector} for WalletConnect v2.
 *
 * In relation to the interface it implements, this class imposes the restriction that all connections it initiates
 * must live on the chain/network that the connector was created with.
 * The connected wallet is assumed to respect this rule.
 */
export class WalletConnectConnector implements WalletConnector {
    readonly client: ISignClient;

    readonly chainId: string;

    readonly delegate: WalletConnectionDelegate;

    readonly connections = new Map<string, WalletConnectConnection>();

    readonly modalConfig: WalletConnectModalConfig;

    readonly namespaceConfig: WalletConnectNamespaceConfig;

    /**
     * Construct a new instance.
     *
     * Use {@link create} to have the sign client initialized from {@link SignClientTypes.Options}
     * to not have to do it manually.
     *
     * The constructor sets up event handling and appropriate forwarding to the provided delegate.
     *
     * @param client The underlying WalletConnect client.
     * @param delegate The object to receive events emitted by the client.
     * @param network The network/chain that connected accounts must live on.
     * @param [namespaceConfig] The namespace configuration of the connections, i.e. which methods and events to request permission for in the wallet. Defaults to {@linkcode FULL_WALLET_CONNECT_NAMESPACE_CONFIG}
     * @param [modalConfig] The configuration of the modal for connecting to the mobile wallet. Defaults to the default invocation of {@linkcode createWalletConnectModalConfig}
     */
    constructor(
        client: SignClient,
        delegate: WalletConnectionDelegate,
        network: Network,
        namespaceConfig: WalletConnectNamespaceConfig = FULL_WALLET_CONNECT_NAMESPACE_CONFIG,
        modalConfig: WalletConnectModalConfig = createWalletConnectModalConfig(network)
    ) {
        this.client = client;
        this.chainId = getChainId(network);
        this.delegate = delegate;
        this.modalConfig = modalConfig;
        this.namespaceConfig = namespaceConfig;

        client.on('session_event', ({ topic, params: { chainId, event }, id }) => {
            console.debug('WalletConnect event: session_event', { topic, id, chainId, event });
            const connection = this.connections.get(topic);
            if (!connection) {
                console.error(`WalletConnect event 'session_event' received for unknown topic '${topic}'.`);
                return;
            }
        });
        client.on('session_update', ({ topic, params }) => {
            console.debug('WalletConnect event: session_update', { topic, params });

            const connection = this.connections.get(topic);
            if (!connection) {
                console.error(`WalletConnect event 'session_update' received for unknown topic '${topic}'.`);
                return;
            }
            const { namespaces } = params;
            // Overwrite session.
            connection.session = { ...connection.session, namespaces };
            delegate.onAccountChanged(connection, connection.getConnectedAccount());
        });
        client.on('session_delete', ({ topic }) => {
            // Session was deleted: Reset the dApp state, clean up user session, etc.
            console.debug('WalletConnect event: session_delete', { topic });
            const connection = this.connections.get(topic);
            if (!connection) {
                console.error(`WalletConnect event 'session_delete' received for unknown topic '${topic}'.`);
                return;
            }
            this.onDisconnect(connection);
        });
    }

    /**
     * Convenience function for creating a new instance from WalletConnection configuration instead of an already initialized client.
     *
     * @param signClientInitOpts WalletConnect configuration.
     * The constant {@link CONCORDIUM_WALLET_CONNECT_PROJECT_ID} exported by this library may be used as {@link SignClientTypes.Options.projectId projectID}
     * if the dApp doesn't have its own {@link https://cloud.walletconnect.com WalletConnect Cloud} project.
     * @param delegate The object to receive events emitted by the client.
     * @param network The network/chain that connected accounts must live on.
     * @param [namespaceConfig] The namespace configuration of the connections, i.e. which methods and events to request permission for in the wallet. Defaults to {@linkcode FULL_WALLET_CONNECT_NAMESPACE_CONFIG}
     * @param [modalConfig] The configuration of the modal for connecting to the mobile wallet. Defaults to the default invocation of {@linkcode createWalletConnectModalConfig}
     */
    static async create(
        signClientInitOpts: SignClientTypes.Options,
        delegate: WalletConnectionDelegate,
        network: Network,
        namespaceConfig: WalletConnectNamespaceConfig = FULL_WALLET_CONNECT_NAMESPACE_CONFIG,
        modalConfig: WalletConnectModalConfig = createWalletConnectModalConfig(network)
    ) {
        const client = await SignClient.init(signClientInitOpts);
        return new WalletConnectConnector(client, delegate, network, namespaceConfig, modalConfig);
    }

    async connect() {
        const namespaceConfig: ProposalTypes.RequiredNamespace = {
            chains: [this.chainId],
            ...this.namespaceConfig,
        };
        const session = await new Promise<SessionTypes.Struct | undefined>((resolve) => {
            connect(this.client, namespaceConfig, () => resolve(undefined), this.modalConfig).then(resolve);
        });
        if (!session) {
            // Connect was cancelled.
            return undefined;
        }
        const connection = new WalletConnectConnection(this, this.chainId, session);
        this.connections.set(session.topic, connection);
        this.delegate.onConnected(connection, connection.getConnectedAccount());
        return connection;
    }

    onDisconnect(connection: WalletConnectConnection) {
        this.connections.delete(connection.session.topic);
        this.delegate.onDisconnected(connection);
    }

    getConnections() {
        return Array.from(this.connections.values());
    }

    /**
     * Disconnect all connections.
     */
    async disconnect() {
        await Promise.all(this.getConnections().map((c) => c.disconnect()));
        // TODO Disconnect the underlying client.
    }
}
