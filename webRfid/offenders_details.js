// Retrieve operator details from localStorage
const operator = JSON.parse(localStorage.getItem('selectedOperator'));
if (operator) {
  document.getElementById('body-number').textContent = operator.bodyNumber;
  document.getElementById('name').textContent = operator.name;
  document.getElementById('uid').textContent = operator.uid;

  // Constants for penalty and initial load
  const penalty = 50.00;
  const initialLoad = 50.00;

  // Fetch and display balance change logs for the selected operator
  async function fetchBalanceChangeLogs() {
    try {
      const response = await fetch(`http://192.168.1.8:5000/get-balance-change?bodyNumber=${encodeURIComponent(operator.bodyNumber)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance change logs');
      }

      const data = await response.json();
      const tbody = document.getElementById('vehicle-operators-list');
      tbody.innerHTML = ''; // Clear any existing rows

      let firstNegativeBalance = null; // Variable to track the first negative balance

      if (data && data.length > 0) {
        data.forEach((log) => {
          // Format date and time
          const date = new Date(log.date_arrival);
          const formattedDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
          const formattedTime = log.time_arrival.split('.')[0];

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td style="color: ${log.balance <= 0 ? 'red' : 'black'};">${log.balance}</td>
          `;
          tbody.appendChild(row);

          // Capture the first negative balance and stop further processing
          if (firstNegativeBalance === null && log.balance < 0) {
            firstNegativeBalance = Math.abs(log.balance);
          }
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="4">No balance change logs available.</td></tr>';
      }

      // Display penalty, first unpaid ticket, and total amount
      document.getElementById('penalty').textContent = penalty.toFixed(2);
      document.getElementById('unpaid-ticket').textContent = (firstNegativeBalance !== null ? firstNegativeBalance : 0).toFixed(2);
      document.getElementById('initial-load').textContent = initialLoad.toFixed(2);

      const totalAmount = penalty + (firstNegativeBalance || 0) + initialLoad;
      document.getElementById('total-amount').textContent = totalAmount.toFixed(2);
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
