document.addEventListener('DOMContentLoaded', async () => {
  const API_URL = 'https://websafely.net/api/urls/check-score';
  const AUTH_TOKEN = 'cAwXNZ8mPOeM7VtF6mJQdlU5vOVGhbz6'; // Not sensitive, just to make sure that requests are coming from extension.
  const urlDiv = document.getElementById('url');
  const scoreDiv = document.getElementById('score');
  const riskDiv = document.getElementById('risk');
  const errorDiv = document.getElementById('error');
  const submitBtn = document.getElementById('submit-btn');

  // Helper to get risk text
  function getRiskText(score) {
    if (score > 70) return {text: 'High Risk', desc: 'Strong scam indicators detected. Avoid using this site.', color: '#FF0000'};
    if (score > 50) return {text: 'Suspicious', desc: 'Significant Risk Factors Detected. Proceed with caution or avoid.', color: '#FFA500'};
    if (score > 30) return {text: 'Uncertain', desc: 'Limited data or mixed signals. Few Risk Factors detected. Be cautious if using.', color: '#FFD700'};
    return {text: 'Low Risk', desc: 'No significant scam indicators found, Likely Safe.', color: '#00FF00'};
  }

  // Get current tab URL
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.url) {
      errorDiv.textContent = 'Unable to get current tab URL.';
      return;
    }
    var parsedUrl = new URL(tab.url);
    if (parsedUrl.protocol.startsWith('https') || parsedUrl.protocol.startsWith('https')) {
      var host = parsedUrl.hostname;
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
        if (status === "pending") {
          scoreDiv.textContent = "Pending";
          riskDiv.textContent = "Pending";
          errorDiv.textContent = "URL not present in websafely database, but has been added to the queue. Refresh page after a few seconds to see the results.";
          submitBtn.style.display = 'none';
          return;
        }
        scoreDiv.textContent = score;
        const risk = getRiskText(score);
        const details = "Check key stats about this site at websafely.net"
        riskDiv.innerHTML = `<span style='color:${risk.color};font-weight:bold;'>${risk.text}</span><br><span style='font-size:0.95em;'>${risk.desc}</span><br><span style='font-size:0.80em;'>${details}</span>`;
        errorDiv.textContent = '';
        submitBtn.style.display = 'none';
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