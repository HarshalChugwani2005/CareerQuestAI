// background.js - Service Worker: batch + encrypt + POST every 5min

let eventsBuffer = [];
let studentId = null;
let isPaused = false;
let secretKey = 'careerquestai-32byte-key-2024!!'; // Replace with user-set key from popup

// Derive AES key using PBKDF2
async function getCryptoKey() {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('careerquest-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
}

// Encrypt payload
async function encryptPayload(payload) {
  const key = await getCryptoKey();
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(payload))
  );
  
  return btoa(String.fromCharCode(...new Uint8Array([...iv, ...new Uint8Array(encrypted)])));
}

// Batch send every 5min
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'batch-send') return;
  if (isPaused || eventsBuffer.length === 0) return;
  
  const batchPayload = {
    student_id: studentId,
    events: eventsBuffer
  };
  
  const encrypted = await encryptPayload(batchPayload);
  
  try {
    await fetch('https://your-ravi-backend.com/api/telemetry/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encrypted_payload: encrypted })
    });
    console.log('Telemetry sent');
  } catch (e) {
    console.error('Send failed:', e);
  }
  
  eventsBuffer = [];
});

// Receive from content script
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'TELEMETRY_EVENT') {
    eventsBuffer.push(msg);
    // Update today's count in storage
    chrome.storage.local.get(['todayCount', 'lastDate'], (result) => {
      const today = new Date().toISOString().split('T')[0];
      let count = result.todayCount || 0;
      if (result.lastDate !== today) {
        count = 0; // Reset for new day
      }
      count += msg.actions_count || 1;
      chrome.storage.local.set({ todayCount: count, lastDate: today });
    });
    return true; // Keep channel open for async response
  }
  if (msg.type === 'SET_STUDENT_ID') studentId = msg.studentId;
  if (msg.type === 'TOGGLE_PAUSE') isPaused = msg.paused;
  if (msg.type === 'SET_KEY') secretKey = msg.key;
});

// Alarm setup on install (not onStartup which misses first install)
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('batch-send', { periodInMinutes: 5 });
  // Show privacy page on first install
  chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
});

// Also ensure alarm exists on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('batch-send', { periodInMinutes: 5 });
});
