const API_URL = 'https://websafely.net/api/urls/check-score';
const AUTH_TOKEN = 'cAwXNZ8mPOeM7VtF6mJQdlU5vOVGhbz6'; // Not sensitive, just to make sure that requests are coming from extension.

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      if (url.protocol.startsWith('https') || url.protocol.startsWith('https')) {
        const baseUrl = `${url.protocol}//${url.hostname}/`;
        checkScamScore(baseUrl, tabId);
      }
    } catch (error) {
      console.error('Invalid URL:', error);
    }
  }
});

// Notify the user to pin the extension on installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Display a notification to the user
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon48.png", // Use one of your icons
      title: "WebSafely Scam Checker Installed",
      message:
        "For quick access to scam scores, please pin this extension to your toolbar.",
      priority: 2,
    });

  }
});

async function checkScamScore(domain, tabId) {
  try {
    const response = await fetch(`${API_URL}?url=${encodeURIComponent(domain)}`, {
      headers: {
        'x-auth-token': AUTH_TOKEN
      }
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }


    const data = await response.json();
    const score = data.scamScore;
    
    // Update the badge
    const badgeColor = getBadgeColor(score);
    chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId });
    chrome.action.setBadgeText({ 
      text: score.toString(), 
      tabId 
    });
  } catch (error) {
    chrome.action.setBadgeText({ 
      text: '?', 
      tabId 
    });
  }
}

function getBadgeColor(score) {
  if (score >= 70) return '#FF0000'; // Red for high risk
  if (score >= 30) return '#FFA500'; // Orange for medium risk
  return '#00FF00'; // Green for low risk
} 