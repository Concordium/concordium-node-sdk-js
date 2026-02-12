declare module '*.css' {
    const content: any;
    export default content;
}

declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.jpeg' {
    const content: string;
    export default content;
}

declare module '*.gif' {
    const content: string;
    export default content;
}

// Global window extensions
interface Window {
    React?: any;
    Vue?: any;
}

// Package module declarations
declare module '@concordium/verification-web-ui/styles';

declare module '@concordium/verification-web-ui' {
    export * from './index';
}

declare module '@concordium/verification-web-ui/react' {
    export * from './react';
}

declare module '@concordium/verification-web-ui/vue' {
    export * from './vue';
}
