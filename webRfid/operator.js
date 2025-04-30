let backendUrl = ''; // Global variable to store the backend URL

// Fetch the backend URL when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/get-backend-url');
        const data = await response.json();
        backendUrl = data.backendUrl;
        console.log("Backend URL Loaded:", backendUrl);

        // Call functions that depend on backendUrl after it's set
        fetchProfile();
        fetchDetectedTricycles();
       
    } catch (error) {
        console.error('Error fetching backend URL:', error);
    }
});

// Retrieve operator details from localStorage
const operator = JSON.parse(localStorage.getItem('selectedOperator'));

if (operator) {
  document.getElementById('body-number').textContent = operator.bodyNumber;
 
  document.getElementById('uid').textContent = operator.uid;
  async function fetchData() {
    try {
      const [detectionRes, balanceRes] = await Promise.all([
        fetch(`${backendUrl}/get-detection-details?bodyNumber=${encodeURIComponent(operator.bodyNumber)}`),
        fetch(`${backendUrl}/get-balance-change?bodyNumber=${encodeURIComponent(operator.bodyNumber)}`)
      ]);
  
      if (!detectionRes.ok || !balanceRes.ok) throw new Error('Failed to fetch data');
  
      const detectionData = await detectionRes.json();
      const balanceData = await balanceRes.json();
      const tbody = document.getElementById('vehicle-operators-list');
      tbody.innerHTML = '';
  
      // Sort terminal detections (newest to oldest)
      const terminalRows = detectionData
        .sort((a, b) => new Date(`${b.date_detected}T${b.time_detected}`) - new Date(`${a.date_detected}T${a.time_detected}`))
        .map(detection => {
          const detectedDate = detection.date_detected ? new Date(detection.date_detected) : null;
          return {
            terminalDate: detectedDate ?
              `${detectedDate.getUTCFullYear()}-${String(detectedDate.getUTCMonth() + 1).padStart(2, '0')}-${String(detectedDate.getUTCDate()).padStart(2, '0')}` : '-',
            terminalTime: detection.time_detected ? detection.time_detected.split('.')[0] : '-',
            checkpointDate: '-',
            checkpointTime: '-',
            balance: '-',
            balanceColor: 'black'
          };
        });
  
      // Sort checkpoint balances (oldest to newest)
      balanceData.reverse(); // 

  
      // Assign balances from oldest to bottom-most terminal row upward
      const total = terminalRows.length;
      const balanceCount = balanceData.length;
      for (let i = 0; i < Math.min(balanceCount, total); i++) {
        const rowIndex = total - 1 - i; // bottom-up
        const balance = balanceData[i];
        const arrivalDate = balance.date_arrival ? new Date(balance.date_arrival) : null;
        terminalRows[rowIndex].checkpointDate = arrivalDate ?
          `${arrivalDate.getUTCFullYear()}-${String(arrivalDate.getUTCMonth() + 1).padStart(2, '0')}-${String(arrivalDate.getUTCDate()).padStart(2, '0')}` : '-';
        terminalRows[rowIndex].checkpointTime = balance.time_arrival ? balance.time_arrival.split('.')[0] : '-';
        terminalRows[rowIndex].balance = balance.balance != null ? balance.balance : '-';
        terminalRows[rowIndex].balanceColor = balance.balance <= 0 ? 'red' : 'black';
      }
  
      // Render final table
      for (const rowData of terminalRows) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${rowData.terminalDate}</td>
          <td>${rowData.terminalTime}</td>
          <td>${rowData.checkpointDate}</td>
          <td>${rowData.checkpointTime}</td>
          <td style="color: ${rowData.balanceColor};">${rowData.balance}</td>
        `;
        tbody.appendChild(row);
      }
  
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  fetchData();
} else {
  document.getElementById('sidebar').innerHTML = '<p>No operator selected.</p>';
}

// Go back to the previous page
function goBack() {
  window.history.back();
}

document.addEventListener('DOMContentLoaded', () => {
  const tabIdKey = 'dashboard_tab_id';
  const userRole = localStorage.getItem('user_role');
const expectedRole = 'nbound'; 

if (!userRole || userRole !== expectedRole) {
  alert('Unauthorized access. Redirecting...');
  window.location.href = 'error.html';
}


  let tabId = sessionStorage.getItem(tabIdKey);
  if (!tabId) {
    tabId = Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(tabIdKey, tabId);
  }

  let ws = new WebSocket('ws://localhost:8082');

  function registerTab() {
    userRole = sessionStorage.getItem('user_role'); // re-fetch in case it changed
    if (!userRole) {
      console.error('Role still missing, closing WebSocket.');
      ws.close();
      return;
    }

    ws.send(JSON.stringify({
      type: 'register',
      tabId,
      role: userRole,
      expectedRole
    }));
  }

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
    registerTab();
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.error === 'unauthorized') {
      alert('Unauthorized access. Redirecting...');
      window.location.href = 'error.html';
    } else if (data.error) {
      alert(data.error);
      window.location.href = 'error.html';
    }
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected, attempting to reconnect...');
    setTimeout(() => {
      ws = new WebSocket('ws://localhost:8082');
      ws.onopen = registerTab;
    }, 1000);
  };

  window.addEventListener('beforeunload', () => {
    ws.close();
  });
});