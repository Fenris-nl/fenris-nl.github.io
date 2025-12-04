// Dashboard script - fetches stats from Google Apps Script
(function() {
  // ⚠️ REPLACE THIS with your Google Apps Script Web App URL
  const APPS_SCRIPT_URL = '';

  const setupSection = document.getElementById('setup-required');
  const statsContainer = document.getElementById('stats-container');
  const recentActivity = document.getElementById('recent-activity');

  // If no URL configured, show setup instructions
  if (!APPS_SCRIPT_URL) {
    setupSection.style.display = 'block';
    statsContainer.style.display = 'none';
    recentActivity.style.display = 'none';
    return;
  }

  // Hide setup, show stats
  setupSection.style.display = 'none';
  statsContainer.style.display = 'grid';
  recentActivity.style.display = 'block';

  // Fetch stats
  async function loadStats() {
    try {
      const response = await fetch(APPS_SCRIPT_URL);
      const data = await response.json();

      if (data.error) {
        console.error('Apps Script error:', data.error);
        return;
      }

      // Update stat cards
      document.getElementById('totalLoads').textContent = data.totalLoads || 0;
      document.getElementById('uniqueUsers').textContent = data.uniqueUsers || 0;
      document.getElementById('loadsToday').textContent = data.loadsToday || 0;
      document.getElementById('loadsThisWeek').textContent = data.loadsThisWeek || 0;

      // Update recent activity table
      const tbody = document.getElementById('activityBody');
      tbody.innerHTML = '';

      if (data.recentActivity && data.recentActivity.length > 0) {
        data.recentActivity.forEach(row => {
          const tr = document.createElement('tr');
          const date = new Date(row.timestamp);
          tr.innerHTML = `
            <td>${date.toLocaleString()}</td>
            <td>${row.userHash}</td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="2" class="muted">No activity yet</td></tr>';
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
      document.getElementById('totalLoads').textContent = '!';
      document.getElementById('uniqueUsers').textContent = '!';
      document.getElementById('loadsToday').textContent = '!';
      document.getElementById('loadsThisWeek').textContent = '!';
    }
  }

  loadStats();

  // Refresh every 30 seconds
  setInterval(loadStats, 30000);
})();
