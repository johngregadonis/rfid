// Retrieve operator details from localStorage
const operator = JSON.parse(localStorage.getItem('selectedOperator'));

if (operator) {
  document.getElementById('body-number').textContent = operator.bodyNumber;
  document.getElementById('balance').textContent = operator.balance;
  document.getElementById('uid').textContent = operator.uid;

  // Fetch and display detection details for the selected operator
  async function fetchDetectionDetails() {
    try {
      const response = await fetch(`http://localhost:4000/get-detection-details?bodyNumber=${encodeURIComponent(operator.bodyNumber)}`);
      if (!response.ok) throw new Error('Failed to fetch detection details');

      const data = await response.json();
      const tbody = document.getElementById('detection-details-list');
      tbody.innerHTML = ''; // Clear existing rows

      if (data && data.length > 0) {
        data.forEach(log => {
          const detectedDate = new Date(log.date_detected);
          const formattedDetectedDate = `${detectedDate.getUTCFullYear()}-${String(detectedDate.getUTCMonth() + 1).padStart(2, '0')}-${String(detectedDate.getUTCDate()).padStart(2, '0')}`;
          const formattedDetectedTime = log.time_detected.split('.')[0]; // Remove fractional seconds

          const row = document.createElement('tr');
          row.innerHTML = `<td>${formattedDetectedDate}</td><td>${formattedDetectedTime}</td>`;
          tbody.appendChild(row);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="2">No detection details available.</td></tr>';
      }
    } catch (error) {
      console.error('Error fetching detection details:', error);
    }
  }

  // Fetch and display balance change logs for the selected operator
  async function fetchBalanceChangeLogs() {
    try {
      const response = await fetch(`http://localhost:4000/get-balance-change?bodyNumber=${encodeURIComponent(operator.bodyNumber)}`);
      if (!response.ok) throw new Error('Failed to fetch balance change logs');

      const data = await response.json();
      const tbody = document.getElementById('balance-change-list');
      tbody.innerHTML = ''; // Clear existing rows

      if (data && data.length > 0) {
        data.forEach(log => {
          const date = new Date(log.date_arrival);
          const formattedDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
          const formattedTime = log.time_arrival.split('.')[0]; // Remove fractional seconds

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td style="color: ${log.balance <= 0 ? 'red' : 'black'};">${log.balance}</td>
          `;
          tbody.appendChild(row);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="3">No balance change logs available.</td></tr>';
      }
    } catch (error) {
      console.error('Error fetching balance change logs:', error);
    }
  }

  // Call both functions
  fetchDetectionDetails();
  fetchBalanceChangeLogs();
} else {
  document.getElementById('sidebar').innerHTML = '<p>No operator selected.</p>';
}

// Go back to the previous page
function goBack() {
  window.history.back();
}
