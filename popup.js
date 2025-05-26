document.addEventListener('DOMContentLoaded', async () => {
  const API_URL = 'https://websafely.net/api/urls/check-score';
  const AUTH_TOKEN = 'cAwXNZ8mPOeM7VtF6mJQdlU5vOVGhbz6'; // Not sensitive, just to make sure that requests are coming from extension.
  const urlDiv = document.getElementById('url');
  const scoreDiv = document.getElementById('score');
  const riskDiv = document.getElementById('risk');
  const errorDiv = document.getElementById('error');
  const submitBtn = document.getElementById('submit-btn');
  const statsDiv = document.createElement('div');
  statsDiv.id = 'stats';
  statsDiv.style.marginTop = '10px';
  document.querySelector('.container').appendChild(statsDiv);

  // Helper to get risk text
  function getRiskText(score) {
    if (score > 70) return {text: 'High Risk', desc: 'Strong scam indicators detected. Avoid using this site.', color: '#FF0000'};
    if (score > 50) return {text: 'Suspicious', desc: 'Significant Risk Factors Detected. Proceed with caution or avoid.', color: '#FFA500'};
    if (score > 30) return {text: 'Uncertain', desc: 'Limited data or mixed signals. Few Risk Factors detected. Be cautious if using.', color: '#FFD700'};
    return {text: 'Low Risk', desc: 'No significant scam indicators found, Likely Safe.', color: '#00FF00'};
  }

  // Popularity and threat detection mappings
  const popularityRankMap = {
    0: 'None',
    1: 'Very Popular',
    2: 'Popular',
    3: 'Less Popular'
  };
  const popularityColors = {
    'None': '#ef4444', // red-500
    'Very Popular': '#22c55e', // green-500
    'Popular': '#3b82f6', // blue-500
    'Less Popular': '#fde047' // yellow-500
  };
  const threatDetectionMap = {
    0: 'None',
    3: 'Low',
    6: 'Medium',
    8: 'High'
  };
  const threatDetectionColors = {
    'None': '#6b7280', // gray-500
    'Low': '#fde047', // yellow-500
    'Medium': '#ef4444', // red-500
    'High': '#ef4444' // red-500
  };

  // Domain age color mapping
  function getDomainAgeColor(days) {
    if (days === null || days === undefined) return '#6b7280'; // gray-500
    if (days >= 730) return '#22c55e'; // green-500
    if (days >= 180) return '#3b82f6'; // blue-500
    if (days >= 30) return '#fde047'; // yellow-500
    return '#ef4444'; // red-500
  }

  // Get current tab URL
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.url) {
      errorDiv.textContent = 'Unable to get current tab URL.';
      return;
    }
    const parsedUrl = new URL(tab.url);
    if (parsedUrl.protocol.startsWith('https') || parsedUrl.protocol.startsWith('https')) {
      const host = parsedUrl.hostname;
      urlDiv.textContent = host;
      const baseUrl = `${parsedUrl.protocol}//${host}/`;
      try {
        const response = await fetch(`${API_URL}?url=${encodeURIComponent(baseUrl)}`, {
          headers: { 'x-auth-token': AUTH_TOKEN }
        });
        if (response.status == 404) {
          errorDiv.textContent = 'URL not present in websafely database, but has been added to the queue. Refresh page after a few seconds to see the results.';
          submitBtn.style.display = 'none';
          scoreDiv.textContent = '';
          riskDiv.textContent = '';
          return;
        }
        if (response.status == 500) throw new Error('API request failed');
        const data = await response.json();
        const score = data.scamScore;
        const status = data.status;
        const stats = data.stats;
        if (status === "pending") {
          scoreDiv.textContent = "Pending";
          riskDiv.textContent = "Pending";
          errorDiv.textContent = "URL not present in websafely database, but has been added to the queue. Refresh page after a few seconds to see the results.";
          submitBtn.style.display = 'none';
          return;
        }
        scoreDiv.textContent = score;
        const risk = getRiskText(score);
        riskDiv.innerHTML = `<span style='color:${risk.color};font-weight:bold;'>${risk.text}</span><br><span style='font-size:0.95em;'>${risk.desc}</span>`;
        errorDiv.textContent = '';
        submitBtn.style.display = 'none';
        // Display stats if available
        if (stats && stats.statsStatus === 'completed') {
          // Map popularity and threat detection to text and color
          const popularityText = popularityRankMap[stats.popularity] || 'N/A';
          const popularityColor = popularityColors[popularityText] || '#fff';
          const threatText = threatDetectionMap[stats.threat_detection] || 'N/A';
          const threatColor = threatDetectionColors[threatText] || '#fff';
          const domainAge = typeof stats.domain_age_days === 'number' ? stats.domain_age_days : null;
          const domainAgeColor = getDomainAgeColor(domainAge);
          statsDiv.innerHTML = `
            <div style='margin-top:10px;text-align:center;font-size:0.95em;'>
              <strong>Registrar:</strong> ${stats.whois_registrar || 'N/A'}<br>
              <strong>Domain Age:</strong> <span style='color:${domainAgeColor};font-weight:bold;'>${domainAge !== null ? domainAge + ' days' : 'N/A'}</span><br>
              <strong>IP Country:</strong> ${stats.ip_country || 'N/A'}<br>
              <strong>Popularity:</strong> <span style='color:${popularityColor};font-weight:bold;'>${popularityText}</span><br>
              <strong>Threat Level:</strong> <span style='color:${threatColor};font-weight:bold;'>${threatText}</span>
            </div>
          `;
        } else {
          statsDiv.innerHTML = '';
        }
      } catch (err) {
        errorDiv.textContent = 'Error fetching scam score.';
        scoreDiv.textContent = '';
        riskDiv.textContent = '';
        submitBtn.style.display = 'none';
      }
    }
    else{
      errorDiv.textContent = 'Visit a website to view its Scam Score';
      submitBtn.style.display = 'none';
      scoreDiv.textContent = '';
      riskDiv.textContent = '';
      return;
    }
  });
}); 