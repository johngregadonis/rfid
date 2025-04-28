let backendUrl = ''; // Global variable to store the backend URL

// Fetch the backend URL when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/get-backend-url');
        const data = await response.json();
        backendUrl = data.backendUrl;
        console.log("Backend URL Loaded:", backendUrl);

        // Call functions that depend on backendUrl after it's set
        fetchVehicleOperators();
        fetchProfile();
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
      // Fetch both detection details and balance logs
      const [detectionRes, balanceRes] = await Promise.all([
        fetch(`${backendUrl}/get-detection-details?bodyNumber=${encodeURIComponent(operator.bodyNumber)}`),
        fetch(`${backendUrl}/get-balance-change?bodyNumber=${encodeURIComponent(operator.bodyNumber)}`)
      ]);

      if (!detectionRes.ok || !balanceRes.ok) throw new Error('Failed to fetch data');

      const detectionData = await detectionRes.json();
      const balanceData = await balanceRes.json();
      const tbody = document.getElementById('vehicle-operators-list');
      tbody.innerHTML = ''; // Clear previous rows

      const maxRows = Math.max(detectionData.length, balanceData.length);

      for (let i = 0; i < maxRows; i++) {
        const detection = detectionData[i] || {};
        const balance = balanceData[i] || {};

        // Format dates/times
        const detectedDate = detection.date_detected ? new Date(detection.date_detected) : null;
        const formattedDetectedDate = detectedDate ? 
          `${detectedDate.getUTCFullYear()}-${String(detectedDate.getUTCMonth() + 1).padStart(2, '0')}-${String(detectedDate.getUTCDate()).padStart(2, '0')}` : '-';
        const formattedDetectedTime = detection.time_detected ? detection.time_detected.split('.')[0] : '-';

        const arrivalDate = balance.date_arrival ? new Date(balance.date_arrival) : null;
        const formattedArrivalDate = arrivalDate ? 
          `${arrivalDate.getUTCFullYear()}-${String(arrivalDate.getUTCMonth() + 1).padStart(2, '0')}-${String(arrivalDate.getUTCDate()).padStart(2, '0')}` : '-';
        const formattedArrivalTime = balance.time_arrival ? balance.time_arrival.split('.')[0] : '-';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formattedDetectedDate}</td>
          <td>${formattedDetectedTime}</td>
          <td>${formattedArrivalDate}</td>
          <td>${formattedArrivalTime}</td>
          <td style="color: ${balance.balance <= 0 ? 'red' : 'black'};">${balance.balance || '-'}</td>
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
const expectedRole = 'terminal'; 

if (!userRole || userRole !== expectedRole) {
  alert('Unauthorized access. Redirecting...');
  window.location.href = 'error.html';
}


  let tabId = sessionStorage.getItem(tabIdKey);
  if (!tabId) {
    tabId = Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(tabIdKey, tabId);
  }

  let ws = new WebSocket('ws://localhost:8081');

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
      ws = new WebSocket('ws://localhost:8081');
      ws.onopen = registerTab;
    }, 1000);
  };

  window.addEventListener('beforeunload', () => {
    ws.close();
  });
});