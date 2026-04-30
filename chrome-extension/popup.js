// popup.js - UI logic

document.addEventListener('DOMContentLoaded', async () => {
  const studentIdEl = document.getElementById('studentId');
  const encKeyEl = document.getElementById('encKey');
  const pauseToggle = document.getElementById('pauseToggle');
  const saveIdBtn = document.getElementById('saveId');
  const saveKeyBtn = document.getElementById('saveKey');
  const todayCountEl = document.getElementById('todayCount');
  const streakEl = document.getElementById('streak');
  const privacyLink = document.getElementById('privacy');
  
  // Load stored values
  const { studentId, encKey, isPaused, todayCount, streak } = await chrome.storage.local.get([
    'studentId', 'encKey', 'isPaused', 'todayCount', 'streak'
  ]);
  
  if (studentId) studentIdEl.value = studentId;
  if (encKey) encKeyEl.value = encKey;
  pauseToggle.checked = isPaused || false;
  todayCountEl.textContent = todayCount || 0;
  streakEl.textContent = streak || 0;
  
  if (isPaused) {
    document.body.classList.add('paused');
  }
  
  // Save student ID
  saveIdBtn.onclick = () => {
    chrome.storage.local.set({ studentId: studentIdEl.value });
    chrome.runtime.sendMessage({ type: 'SET_STUDENT_ID', studentId: studentIdEl.value });
  };
  
  // Save encryption key
  saveKeyBtn.onclick = () => {
    chrome.storage.local.set({ encKey: encKeyEl.value });
    chrome.runtime.sendMessage({ type: 'SET_KEY', key: encKeyEl.value });
  };
  
  // Pause toggle
  pauseToggle.onchange = () => {
    const paused = pauseToggle.checked;
    chrome.storage.local.set({ isPaused: paused });
    chrome.runtime.sendMessage({ type: 'TOGGLE_PAUSE', paused });
    document.body.classList.toggle('paused', paused);
  };
  
  // Privacy link
  privacyLink.onclick = (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
  };
  
  // Update stats periodically
  setInterval(async () => {
    const stats = await chrome.storage.local.get(['todayCount', 'streak']);
    todayCountEl.textContent = stats.todayCount || 0;
    streakEl.textContent = stats.streak || 0;
  }, 5000);
});
