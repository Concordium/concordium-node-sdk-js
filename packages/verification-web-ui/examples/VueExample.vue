<template>
  <div class="@concordium/verification-web-ui-example">
    <h1>Verification WebUI Example</h1>

    <div class="status-section">
      <h2>Connection Status</h2>
      <p>
        Status: <span :class="statusClass">{{ connectionStatus }}</span>
      </p>
      <p v-if="currentSession">Session Topic: {{ currentSession.topic }}</p>
    </div>

    <div class="actions-section">
      <button
        @click="initializeSDK"
        :disabled="isInitialized"
        class="btn btn-primary"
      >
        Initialize SDK
      </button>

      <button
        @click="startVerification"
        :disabled="!isInitialized || isConnecting"
        class="btn btn-secondary"
      >
        {{ isConnecting ? 'Connecting...' : 'Start Verification' }}
      </button>

      <button
        @click="performVerify"
        :disabled="!currentSession || isVerifying"
        class="btn btn-success"
      >
        {{ isVerifying ? 'Verifying...' : 'Verify Identity' }}
      </button>

      <button
        @click="resetSDK"
        :disabled="!isInitialized"
        class="btn btn-danger"
      >
        Reset SDK
      </button>
    </div>

    <div v-if="qrCodeUri" class="qr-section">
      <h2>Scan QR Code</h2>
      <p>Scan this with your Concordium wallet:</p>
      <div class="qr-code">{{ qrCodeUri }}</div>
    </div>

    <div v-if="verificationResult" class="result-section">
      <h2>Verification Result</h2>
      <pre>{{ JSON.stringify(verificationResult, null, 2) }}</pre>
    </div>

    <div class="events-section">
      <h2>Events Log</h2>
      <div class="events-log">
        <div v-for="(event, index) in events" :key="index" class="event-item">
          <span class="event-time">{{ formatTime(event.timestamp) }}</span>
          <span class="event-type">{{ event.type }}</span>
          <span class="event-source">{{ event.source }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { ConcordiumVerificationWebUI } from '@concordium/verification-web-ui';
import type {
  WalletConnectSession,
  ConcordiumEventData,
} from '@concordium/verification-web-ui';

// SDK instance
const sdk = ref<ConcordiumVerificationWebUI | null>(null);

// State
const isInitialized = ref(false);
const isConnecting = ref(false);
const isVerifying = ref(false);
const currentSession = ref<WalletConnectSession | null>(null);
const qrCodeUri = ref<string>('');
const verificationResult = ref<any>(null);
const events = ref<ConcordiumEventData[]>([]);

// Computed
const connectionStatus = computed(() => {
  if (!isInitialized.value) return 'Not Initialized';
  if (isConnecting.value) return 'Connecting...';
  if (currentSession.value) return 'Connected';
  return 'Disconnected';
});

const statusClass = computed(() => {
  if (!isInitialized.value) return 'status-gray';
  if (isConnecting.value) return 'status-yellow';
  if (currentSession.value) return 'status-green';
  return 'status-red';
});

// Event handler
const handleSDKEvent = (event: ConcordiumEventData) => {
  console.log('SDK Event:', event);
  events.value.unshift(event);

  // Keep only last 20 events
  if (events.value.length > 20) {
    events.value = events.value.slice(0, 20);
  }

  // Handle specific events
  switch (event.type) {
    case 'session-approved':
      currentSession.value = sdk.value?.getCurrentSession() || null;
      isConnecting.value = false;
      break;
    case 'verification-completed':
      verificationResult.value = event.data;
      isVerifying.value = false;
      break;
    case 'error':
      isConnecting.value = false;
      isVerifying.value = false;
      alert(`Error: ${event.data?.error || 'Unknown error'}`);
      break;
  }
};

// Methods
const initializeSDK = async () => {
  try {
    sdk.value = new ConcordiumVerificationWebUI({
      network: 'testnet',
      walletConnect: {
        projectId:
          import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
        metadata: {
          name: 'Verification WebUI Example',
          description: 'Example Vue app using Verification WebUI',
          url: window.location.origin,
          icons: [],
        },
      },
      onEvent: handleSDKEvent,
    });

    await sdk.value.init();
    isInitialized.value = true;

    console.log('SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize SDK:', error);
    alert('Failed to initialize SDK. Check console for details.');
  }
};

const startVerification = async () => {
  if (!sdk.value) return;

  try {
    isConnecting.value = true;
    qrCodeUri.value = '';

    // Use the popup method normally
    // For manual handling, you can use: const uri = await sdk.value.initializeVerification();
    const uri = await sdk.value.initializeVerificationWithPopup(() => {
      console.log('Popup closed');
      if (isConnecting.value) {
        isConnecting.value = false;
      }
    });

    qrCodeUri.value = uri;

    console.log('Verification started. URI:', uri);
  } catch (error) {
    console.error('Failed to start verification:', error);
    isConnecting.value = false;
    alert('Failed to start verification. Check console for details.');
  }
};

const performVerify = async () => {
  if (!sdk.value || !currentSession.value) return;

  try {
    isVerifying.value = true;

    const result = await sdk.value.performVerification(currentSession.value);
    verificationResult.value = result;

    console.log('Verification completed:', result);
  } catch (error) {
    console.error('Verification failed:', error);
    isVerifying.value = false;
    alert('Verification failed. Check console for details.');
  }
};

const resetSDK = async () => {
  if (!sdk.value) return;

  try {
    await sdk.value.resetVerification();
    sdk.value.reset();

    // Reset state
    isInitialized.value = false;
    isConnecting.value = false;
    isVerifying.value = false;
    currentSession.value = null;
    qrCodeUri.value = '';
    verificationResult.value = null;
    events.value = [];
    sdk.value = null;

    console.log('SDK reset successfully');
  } catch (error) {
    console.error('Failed to reset SDK:', error);
  }
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

// Lifecycle
onMounted(() => {
  console.log('Component mounted. Click "Initialize SDK" to start.');
});

onBeforeUnmount(() => {
  if (sdk.value) {
    sdk.value.reset();
  }
});
</script>

<style scoped>
.@concordium/verification-web-ui-example {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

h2 {
  color: #34495e;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.status-section,
.actions-section,
.qr-section,
.result-section,
.events-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-section p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.status-gray {
  color: #95a5a6;
}
.status-yellow {
  color: #f39c12;
}
.status-green {
  color: #27ae60;
}
.status-red {
  color: #e74c3c;
}

.actions-section {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #9b59b6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #8e44ad;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #229954;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.qr-code {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
  font-size: 0.9rem;
}

.result-section pre {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
}

.events-log {
  max-height: 300px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 0.5rem;
}

.event-item {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

.event-item:last-child {
  border-bottom: none;
}

.event-time {
  color: #7f8c8d;
  min-width: 80px;
}

.event-type {
  color: #2c3e50;
  font-weight: 600;
  min-width: 150px;
}

.event-source {
  color: #95a5a6;
}
</style>
