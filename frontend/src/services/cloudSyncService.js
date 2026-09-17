// Cloud Real-Time Pub/Sub Synchronization Service for SehatSetu
// Enables instant real-time synchronization between different physical laptops, smartphones, and tablets globally.

const CLOUD_CHANNEL = 'sehatsetu_teleconsult_sih2026';
const CLOUD_ENDPOINT = `https://ntfy.sh/${CLOUD_CHANNEL}`;
const SSE_ENDPOINT = `https://ntfy.sh/${CLOUD_CHANNEL}/sse`;

// Unique client instance ID to avoid echoing back local messages
const getClientId = () => {
  try {
    let id = sessionStorage.getItem('sehatsetu_client_id');
    if (!id) {
      id = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('sehatsetu_client_id', id);
    }
    return id;
  } catch (e) {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
};

const CLIENT_ID = getClientId();
const subscribers = new Set();
let eventSource = null;
let isConnected = false;
let reconnectTimeout = null;
const processedMessageIds = new Set();

/**
 * Initialize Cloud Realtime Stream Listener (Server-Sent Events)
 */
function initCloudListener() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

  if (eventSource) {
    try {
      eventSource.close();
    } catch (e) {}
  }

  try {
    eventSource = new EventSource(SSE_ENDPOINT);

    eventSource.onopen = () => {
      isConnected = true;
      // console.log('[SehatSetu CloudSync] Connected to global teleconsultation cloud channel.');
    };

    eventSource.onmessage = (event) => {
      try {
        if (!event.data) return;
        const parsedWrapper = JSON.parse(event.data);

        // ntfy.sh wraps messages inside an 'event' object: { id, event: 'message', message: '...' }
        if (parsedWrapper.event === 'message' && parsedWrapper.message) {
          const rawMessage = parsedWrapper.message;
          let payload;

          try {
            payload = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage;
          } catch (err) {
            return;
          }

          if (!payload || !payload.type) return;

          // Message deduplication
          const msgKey = payload.messageId || `${payload.type}_${payload.timestamp}_${payload.senderId}`;
          if (processedMessageIds.has(msgKey)) return;
          processedMessageIds.add(msgKey);
          if (processedMessageIds.size > 200) {
            const first = processedMessageIds.values().next().value;
            processedMessageIds.delete(first);
          }

          // Ignore messages sent by this client instance (already handled locally)
          if (payload.senderId === CLIENT_ID) return;

          // Notify all local subscribers
          subscribers.forEach((callback) => {
            try {
              callback(payload.type, payload.detail);
            } catch (cbErr) {
              console.warn('[SehatSetu CloudSync] Subscriber callback error:', cbErr);
            }
          });
        }
      } catch (err) {
        console.warn('[SehatSetu CloudSync] Message parse error:', err);
      }
    };

    eventSource.onerror = (err) => {
      isConnected = false;
      try {
        eventSource.close();
      } catch (e) {}

      // Reconnect after 3 seconds
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        initCloudListener();
      }, 3000);
    };
  } catch (err) {
    console.warn('[SehatSetu CloudSync] EventSource init note:', err);
  }
}

// Start listener immediately in browser environments
if (typeof window !== 'undefined') {
  initCloudListener();
}

export const cloudSyncService = {
  /**
   * Broadcast an event across the cloud to all other laptops and devices
   */
  async publish(type, detail) {
    if (!type) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    processedMessageIds.add(messageId);

    const payload = {
      senderId: CLIENT_ID,
      messageId,
      type,
      detail,
      timestamp: Date.now()
    };

    try {
      await fetch(CLOUD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Title': `SehatSetu Teleconsult - ${type}`,
          'Priority': 'urgent'
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('[SehatSetu CloudSync] Publish failed:', err);
    }
  },

  /**
   * Subscribe to incoming cloud events from other laptops/devices
   */
  subscribe(callback) {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  },

  getClientId() {
    return CLIENT_ID;
  }
};
