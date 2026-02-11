# Concordium Verification WebUI

> A lightweight, framework-agnostic SDK for Concordium wallet integration and identity verification with pre-built UI components.

[![npm version](https://img.shields.io/npm/v/@concordium/verification-web-ui.svg)](https://www.npmjs.com/package/@concordium/verification-web-ui)
[![License](https://img.shields.io/npm/l/@concordium/verification-web-ui.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Integrate Concordium wallet connections into your app with just a few lines of code. The SDK provides beautiful, responsive modals for desktop and mobile, handles all WalletConnect complexity, and supports Vue, React, and vanilla JavaScript.

# Verification WebUI - Event-Driven Usage Guide

## Architecture

```
SDK Responsibilities:
├── UI Modals (Landing, Scan, Processing, Success)
├── WalletConnect Session Management
├── QR Code Generation & Display
└── Event Emission

Merchant Responsibilities:
├── Listen to SDK Events
├── Create Presentation/ZKP Requests
├── Verify ZKP Responses
└── Handle Business Logic
```

## Two Integration Modes

### Case 1: SDK-Managed WalletConnect (Recommended)

SDK initializes WalletConnect, generates QR codes automatically.

### Case 2: Merchant-Managed WalletConnect

Merchant manages WalletConnect, SDK only displays QR codes.

---

## Installation

```bash
npm install @concordium/verification-web-ui
```

---

## Case 1: SDK-Managed WalletConnect

### Step 1: Initialize SDK

```typescript
import { ConcordiumVerificationWebUI } from '@concordium/verification-web-ui';
import '@concordium/verification-web-ui/styles';

const sdk = new ConcordiumVerificationWebUI({
  network: 'testnet', // or 'mainnet'
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  metadata: {
    name: 'Your App Name',
    description: 'Your app description',
    url: 'https://yourapp.com',
    icons: ['https://yourapp.com/icon.png'],
  },
});
```

### Step 2: Listen to SDK Events

```typescript
window.addEventListener(
  '@concordium/verification-web-ui-event',
  async event => {
    const { type, data } = event.detail;

    switch (type) {
      case 'session_approved':
        await handleSessionApproved(data);
        break;

      case 'presentation_received':
        await handlePresentationReceived(data);
        break;

      case 'session_disconnected':
        handleDisconnected(data);
        break;

      case 'error':
        handleError(data);
        break;
    }
  }
);
```

### Step 3: Show Connection Modal

```typescript
// This will:
// 1. Initialize WalletConnect
// 2. Generate QR code
// 3. Show scan modal
await sdk.renderUIModals();
```

### Step 4: Handle Session Approval

When user scans QR code, SDK emits `session_approved`:

```typescript
async function handleSessionApproved(sessionData) {
  const { topic, accounts, namespaces } = sessionData;

  console.log('Session approved!');
  console.log('Topic:', topic);
  console.log('Accounts:', accounts);

  // Create your presentation request
  const presentationRequest = {
    challenge: generateChallenge(), // Your challenge generation
    credentialSubject: {
      attributes: ['age'],
      threshold: 18,
      operator: 'gte',
    },
  };

  // Send request through SDK
  await sdk.sendPresentationRequest(presentationRequest);
}
```

### Step 5: Handle ZKP Response

When wallet responds, SDK emits `presentation_received`:

```typescript
async function handlePresentationReceived(zkpResponse) {
  // Verify the ZKP proof at your backend or locally
  const isValid = await verifyProof(zkpResponse);

  if (isValid) {
    // Show success state in SDK
    await sdk.showSuccessState();

    // Your business logic
    onVerificationSuccess(zkpResponse);
  } else {
    console.error('Verification failed');
    sdk.closeModal();
  }
}
```

---

## Case 2: Merchant-Managed WalletConnect

### Step 1: Initialize Your Own WalletConnect

```typescript
import { SignClient } from '@walletconnect/sign-client';

const wcClient = await SignClient.init({
  projectId: 'YOUR_PROJECT_ID',
  metadata: {
    /* ... */
  },
});

const { uri, approval } = await wcClient.connect({
  requiredNamespaces: {
    ccd: {
      methods: ['request_verifiable_presentation_v1'],
      chains: ['ccd:4221332d34e1694168c2a0c0b3fd0f27'],
      events: [],
    },
  },
});
```

### Step 2: Show QR Code via SDK

```typescript
import { ConcordiumVerificationWebUI } from '@concordium/verification-web-ui';

const sdk = new ConcordiumVerificationWebUI({ network: 'testnet' });

// SDK will display the QR code
await sdk.showWalletConnectPopup(uri);
```

### Step 3: Handle Session Approval

```typescript
const session = await approval();

// SDK emits session_approved event
window.addEventListener(
  '@concordium/verification-web-ui-event',
  async event => {
    if (event.detail.type === 'session_approved') {
      // Send your presentation request through YOUR WalletConnect client
      const response = await wcClient.request({
        topic: session.topic,
        chainId: 'ccd:4221332d34e1694168c2a0c0b3fd0f27',
        request: {
          method: 'request_verifiable_presentation_v1',
          params: yourPresentationRequest,
        },
      });

      // Verify and show success
      if (await verifyProof(response)) {
        await sdk.showSuccessState();
      }
    }
  }
);
```

---

## Existing Session Usage

If you already have an active WalletConnect session:

```typescript
// Send a new request to existing session
await sdk.sendRequestToExistingSession(
  presentationRequest,
  existingSessionTopic
);

// SDK will:
// 1. Show processing modal
// 2. Send request
// 3. Emit presentation_received event
```

---

## SDK Events Reference

### `session_approved`

Emitted when WalletConnect session is established.

```typescript
{
  type: 'session_approved',
  data: {
    topic: string,
    accounts: string[],
    namespaces: Record<string, any>
  }
}
```

### `presentation_received`

Emitted when ZKP response is received from wallet.

```typescript
{
  type: 'presentation_received',
  data: {
    verifiablePresentation: any,
    presentationContext: any,
    proof: any,
    type: any,
    verifiableCredential: any
  }
}
```

### `session_disconnected`

Emitted when WalletConnect session is disconnected.

```typescript
{
  type: 'session_disconnected',
  data: {
    topic: string
  }
}
```

### `error`

Emitted when any error occurs.

```typescript
{
  type: 'error',
  data: {
    message: string,
    error: any
  }
}
```

---

## SDK Methods Reference

### `renderUIModals()`

Initialize and show connection modal (SDK-managed mode).

```typescript
await sdk.renderUIModals();
```

### `showWalletConnectPopup(uri, onClose?)`

Display QR code for merchant-provided URI.

```typescript
await sdk.showWalletConnectPopup(walletConnectUri);
```

### `sendPresentationRequest(request, sessionTopic?)`

Send ZKP/presentation request through WalletConnect.

```typescript
await sdk.sendPresentationRequest({
  challenge: 'your-challenge',
  credentialSubject: {
    /* ... */
  },
});
```

### `sendRequestToExistingSession(request, sessionTopic)`

Send request to existing session with processing modal.

```typescript
await sdk.sendRequestToExistingSession(request, topic);
```

### `showSuccessState()`

Display success state in processing modal.

```typescript
await sdk.showSuccessState();
```

### `closeModal()`

Close any open modal.

```typescript
sdk.closeModal();
```

### `getCurrentSession()`

Get current active session.

```typescript
const session = sdk.getCurrentSession();
```

---

## Complete Example (Vue 3)

```vue
<template>
  <div>
    <button @click="connect">Connect Wallet</button>
    <div v-if="connected">
      <button @click="verify">Verify Age</button>
      <p v-if="verified">✅ Verified!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ConcordiumVerificationWebUI } from '@concordium/verification-web-ui';
import '@concordium/verification-web-ui/styles';

const connected = ref(false);
const verified = ref(false);
let sdk;

onMounted(() => {
  sdk = new ConcordiumVerificationWebUI({
    network: 'testnet',
    projectId: process.env.VUE_APP_WC_PROJECT_ID,
    metadata: {
      name: 'My App',
      description: 'Age verification app',
      url: window.location.origin,
      icons: [`${window.location.origin}/logo.png`],
    },
  });

  // Listen to SDK events
  window.addEventListener(
    '@concordium/verification-web-ui-event',
    handleSDKEvent
  );
});

async function handleSDKEvent(event) {
  const { type, data } = event.detail;

  if (type === 'session_approved') {
    connected.value = true;

    // Automatically send age verification request
    const request = {
      challenge: generateChallenge(),
      credentialSubject: {
        attributes: ['age'],
        threshold: 18,
      },
    };

    await sdk.sendPresentationRequest(request);
  }

  if (type === 'presentation_received') {
    // Verify the proof
    const isValid = await verifyAtBackend(data);

    if (isValid) {
      verified.value = true;
      await sdk.showSuccessState();

      // Auto-close after 2 seconds
      setTimeout(() => sdk.closeModal(), 2000);
    }
  }

  if (type === 'error') {
    console.error('SDK Error:', data);
    alert('Verification failed');
  }
}

async function connect() {
  await sdk.renderUIModals();
}

async function verify() {
  // Re-verify using existing session
  const session = sdk.getCurrentSession();
  if (session) {
    await sdk.sendRequestToExistingSession(
      createVerificationRequest(),
      session.topic
    );
  }
}

function generateChallenge() {
  return crypto.randomUUID();
}

async function verifyAtBackend(zkpResponse) {
  // Your verification logic
  const response = await fetch('/api/verify', {
    method: 'POST',
    body: JSON.stringify(zkpResponse),
  });
  return response.ok;
}
</script>
```
