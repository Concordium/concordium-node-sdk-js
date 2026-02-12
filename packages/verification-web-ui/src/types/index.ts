// Common interfaces
export interface WalletOption {
    value: string;
    text: string;
    icon: string;
    checked: boolean;
}

// SDK Event Types for merchant communication
export interface SessionApprovedEvent {
    topic: string;
    accounts: string[];
    namespaces: Record<string, any>;
}

export interface PresentationRequest {
    challenge: string;
    credentialSubject?: any;
    [key: string]: any;
}

export interface PresentationResponse {
    verifiablePresentation: any;
    presentationContext: any;
    proof: any;
    type: any;
    verifiableCredential: any;
}

export type SDKEventType = 'session_approved' | 'presentation_received' | 'session_disconnected' | 'error';

export interface SDKEvent<T = any> {
    type: SDKEventType;
    data: T;
}

export interface StepConfiguration {
    count: string;
    text: string;
}

export interface CarouselItem {
    image: string;
    alt: string;
    title: string;
    points: CarouselPoint[];
    reduceOpacity?: boolean;
}

export interface CarouselPoint {
    icon: string;
    text: string;
}

export interface DropdownConfig {
    containerClass?: string;
    triggerClass?: string;
    menuClass?: string;
    optionClass?: string;
    lastOptionClass?: string;
    onSelect?: (selected: WalletOption) => void;
}

export interface CarouselOptions {
    autoPlayInterval?: number;
    transitionDuration?: number;
    swipeThreshold?: number;
    enableAutoPlay?: boolean;
    enableSwipe?: boolean;
    onSlideChange?: (index: number) => void;
}

// DOM element types
export interface ModalElements {
    modal: HTMLElement;
    qrContainer: HTMLElement | null;
    footerIcon: HTMLElement | null;
    pointList: HTMLElement | null;
    browserBtn: HTMLElement | null;
}

// State interfaces
export interface AppState {
    selectedWallet: string;
    onlyOneOption: boolean;
    appNotInstalled?: boolean;
    concordiumIDNotInstalled?: boolean;
}

// Content map interface for modal states
export interface ContentMapItem {
    title: string;
    image: string;
    subtitle: string;
    buttonsHTML: string;
}

export type ContentMap = Record<string, ContentMapItem>;

// Container interface
export interface ModalContainer {
    element: HTMLElement;
    selector?: string;
}

// Modal function types
export type ModalFunction = () => HTMLElement;
export type ShowModalFunction = () => void | Promise<void>;
export type HideModalFunction = () => void;
export type ShowModalWithContainerFunction = (container: HTMLElement | string) => void;

// Event handler types
export type EventHandler = (event: Event) => void;
export type ClickHandler = (event: MouseEvent) => void;

// WalletConnect types
export interface WalletConnectSession {
    topic: string;
    relay: {
        protocol: string;
        data?: string;
    };
    expiry: number;
    acknowledged: boolean;
    controller: string;
    namespaces: Record<string, any>;
    requiredNamespaces: Record<string, any>;
    optionalNamespaces?: Record<string, any>;
    sessionProperties?: Record<string, any>;
}

export interface WalletConnectConfig {
    projectId: string;
    metadata: {
        name: string;
        description: string;
        url: string;
        icons: string[];
    };
    relayUrl?: string;
}

// Connection mode for SDK: either SDK generates QR or merchant provides it
export type ConnectionMode = 'sdk-managed' | 'merchant-provided';

export interface SDKWalletConnectConfig {
    projectId: string;
    metadata?: {
        name?: string;
        description?: string;
        url?: string;
        icons?: string[];
    };
}

export interface QRCodeConfig {
    // How long before QR code expires (in milliseconds)
    expiryDuration?: number;
    // Whether to auto-refresh SDK-generated QR codes
    autoRefresh?: boolean;
    // Show countdown timer on QR code
    showCountdown?: boolean;
}

export * from './services';
