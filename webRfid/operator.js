// Retrieve operator details from localStorage
const operator = JSON.parse(localStorage.getItem('selectedOperator'));
if (operator) {
  document.getElementById('body-number').textContent = operator.bodyNumber;
  document.getElementById('balance').textContent = operator.balance;
  document.getElementById('uid').textContent = operator.uid;

  // Fetch and display balance change logs for the selected operator
  async function fetchBalanceChangeLogs() {
    try {
      const response = await fetch(`http://localhost:4000/get-balance-change?bodyNumber=${encodeURIComponent(operator.bodyNumber)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance change logs');
      }

      const data = await response.json();
      const tbody = document.getElementById('vehicle-operators-list');
      tbody.innerHTML = ''; // Clear any existing rows

      if (data && data.length > 0) {
        data.forEach(log => {
          // Format date and time using UTC methods without local time zone conversion
          const date = new Date(log.date_arrival);

          // Get the year, month, and day in UTC without shifting to local time zone
          const formattedDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
          
          // Use only the time part from the time_arrival field
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
        tbody.innerHTML = '<tr><td colspan="4">No balance change logs available.</td></tr>';
      }
    } catch (error) {
      console.error('Error fetching balance change logs:', error);
    }
  }

  // Call the async function
  fetchBalanceChangeLogs();
} else {
  document.getElementById('sidebar').innerHTML = '<p>No operator selected.</p>';
}

// Go back to the previous page
function goBack() {
  window.history.back();
}
