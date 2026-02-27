/**
 * Example integration demonstrating both WalletConnect modes
 *
 * This file shows how to use the Verification WebUI with either:
 * 1. SDK-managed WalletConnect (simple)
 * 2. Merchant-provided WalletConnect URI (advanced)
 */

import { ConcordiumVerificationWebUI } from '../src/sdk';
import type { ConcordiumEventData } from '../src/config.state';

// ============================================
// OPTION 1: SDK-Managed WalletConnect
// ============================================
// This is the recommended approach for most integrations

async function exampleSDKManaged() {
  console.log('Example: SDK-Managed WalletConnect');

  const sdk = new ConcordiumVerificationWebUI({ network: 'testnet' }); // Set Concordium network here

  try {
    await sdk.initWalletConnect(
      {
        projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from cloud.walletconnect.com
        metadata: {
          name: 'My Merchant App',
          description: 'Example merchant application using Concordium',
          url: 'https://example.com',
          icons: ['https://example.com/logo.png'],
        },
      },
      () => {
        // Optional: Handle modal close
        console.log('WalletConnect modal was closed');
      }
    );

    console.log('SDK-managed WalletConnect initialized successfully');
  } catch (error) {
    console.error('Failed to initialize SDK-managed WalletConnect:', error);
  }
}

// ============================================
// OPTION 2: Merchant-Provided URI
// ============================================
// Use this when you need full control over WalletConnect

async function exampleMerchantProvided() {
  console.log('Example: Merchant-Provided URI');

  // This would normally come from your own WalletConnect client
  // For demonstration, we'll show what the flow would look like

  const walletConnectURI = 'wc:a281567bb3e4...'; // Your WalletConnect URI

  const sdk = new ConcordiumVerificationWebUI({ network: 'testnet' }); // Set Concordium network

  try {
    await sdk.showWalletConnectPopup(walletConnectURI, () => {
      console.log('WalletConnect modal was closed');
    });

    console.log('Merchant-provided WalletConnect popup shown successfully');
  } catch (error) {
    console.error('Failed to show WalletConnect popup:', error);
  }
}

// ============================================
// Event Handling
// ============================================
// Both modes dispatch the same events

function setupEventListeners() {
  window.addEventListener('concordium-event', (event: Event) => {
    const { type, data, source, modalType } = (
      event as CustomEvent<ConcordiumEventData>
    ).detail;

    console.log('Concordium Event:', {
      type,
      data,
      source,
      modalType,
    });

    switch (type) {
      case 'session-approved':
        console.log('WalletConnect session approved');
        console.log('Session data:', data.session);
        console.log('Accounts:', data.accounts);
        break;

      case 'session-rejected':
        console.log('User rejected the connection');
        break;

      case 'verification-completed':
        console.log('Verification completed successfully');
        console.log('Result:', data.result);
        break;

      case 'verification-failed':
        console.log('Verification failed');
        console.log('Error:', data.error);
        break;

      case 'error':
        console.error('Error occurred:', data.error);
        break;

      case 'close':
        console.log('Modal closed');
        break;
    }
  });
}

// ============================================
// React Integration Example
// ============================================

// @ts-ignore - Example function for documentation
function ReactExample() {
  // In a React component:
  // @ts-ignore - Example function for documentation
  const handleConnect = async () => {
    const sdk = new ConcordiumVerificationWebUI({ network: 'testnet' });

    await sdk.initWalletConnect({
      projectId: process.env.REACT_APP_WC_PROJECT_ID!,
    });
  };

  return `
    <button onClick={handleConnect}>
      Connect Concordium Wallet
    </button>
  `;
}

// ============================================
// Vue Integration Example
// ============================================

// @ts-ignore - Example function for documentation
function VueExample() {
  return `
<template>
  <button @click="handleConnect">
    Connect Concordium Wallet
  </button>
</template>

<script setup>
import { ConcordiumVerificationWebUI } from '@concordium/verification-web-ui';

const handleConnect = async () => {
  const sdk = new ConcordiumVerificationWebUI();
  { network: 'testnet' });
  
  await sdk.initWalletConnect({
    projectId: import.meta.env.VITE_WC_PROJECT_ID,
};
</script>
  `;
}

// ============================================
// Usage with Configuration
// ============================================

async function exampleWithConfig() {
  const sdk = new ConcordiumVerificationWebUI({
    network: 'testnet',
    onSuccess: (data: ConcordiumEventData) => {
      console.log('Success callback:', data);
    },
    onError: (data: ConcordiumEventData) => {
      console.error('Error callback:', data);
    },
    onClose: (data: ConcordiumEventData) => {
      console.log('Close callback:', data);
    },
  });

  await sdk.initWalletConnect({
    projectId: 'YOUR_PROJECT_ID',
  });
}

// ============================================
// Advanced: Manual Session Management
// ============================================

async function advancedExample() {
  const sdk = new ConcordiumVerificationWebUI({ network: 'testnet' });

  // First, initialize the connection
  await sdk.initWalletConnect({
    projectId: 'YOUR_PROJECT_ID',
  });

  // Listen for specific events
  window.addEventListener('concordium-event', async (event: Event) => {
    const customEvent = event as CustomEvent<ConcordiumEventData>;
    if (customEvent.detail.type === 'session-approved') {
      const { session } = customEvent.detail.data;

      // You can now use the session for custom operations
      console.log('Session topic:', session.topic);
      console.log('Connected accounts:', session.namespaces?.ccd?.accounts);

      // Example: Show success UI
      await sdk.showSuccessState();
    }
  });
}

// ============================================
// Export examples
// ============================================

export {
  exampleSDKManaged,
  exampleMerchantProvided,
  setupEventListeners,
  exampleWithConfig,
  advancedExample,
};

// ============================================
// Auto-run example in development
// ============================================

if (import.meta.env.DEV) {
  console.log('='.repeat(50));
  console.log('Verification WebUI - WalletConnect Examples');
  console.log('='.repeat(50));

  // Uncomment the example you want to try:

  // setupEventListeners();
  // await exampleSDKManaged();
  // await exampleMerchantProvided();
  // await exampleWithConfig();
  // await advancedExample();
}
