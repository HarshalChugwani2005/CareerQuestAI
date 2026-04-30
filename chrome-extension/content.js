// content.js - Track job search actions (privacy: counts only)
(function() {
  'use strict';

  // Portals
  const PORTALS = {
    'linkedin.com': 'LINKEDIN',
    'indeed.com': 'INDEED',
    'naukri.com': 'NAUKRI'
  };

  // Detect portal
  const hostname = window.location.hostname.replace('www.', '');
  const portal = Object.keys(PORTALS).find(key => hostname.includes(key));
  if (!portal) return;

  const portalName = PORTALS[portal];
  let sessionStart = Date.now();
  let actionCounts = { visits: 0, clicks: 0, saves: 0, searches: 0 };

  // Track page visits
  actionCounts.visits++;

  // Detect apply/save clicks
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a');
    if (!target) return;
    
    const text = target.textContent.toLowerCase();
    if (text.includes('apply') || text.includes('easy apply')) {
      actionCounts.clicks++;
    } else if (text.includes('save') || text.includes('save job')) {
      actionCounts.saves++;
    }
  }, true);

  // Detect searches (URL param or input)
  const urlSearch = new URLSearchParams(window.location.search).get('keywords') || 
    new URLSearchParams(window.location.search).get('q') ||
    new URLSearchParams(window.location.search).get('search');
  if (urlSearch) actionCounts.searches++;

  // Send to background every 30s
  setInterval(() => {
    const duration = (Date.now() - sessionStart) / 60000; // minutes
    const totalActions = Object.values(actionCounts).reduce((a, b) => a + b, 0);
    
    if (totalActions > 0) {
      chrome.runtime.sendMessage({
        type: 'TELEMETRY_EVENT',
        portal: portalName,
        actions_count: totalActions,
        duration_minutes: Math.round(duration * 100) / 100,
        timestamp: new Date().toISOString()
      });
      
      // Reset for next batch
      actionCounts = { visits: 0, clicks: 0, saves: 0, searches: 0 };
      sessionStart = Date.now();
    }
  }, 30000); // 30s batch
})();
