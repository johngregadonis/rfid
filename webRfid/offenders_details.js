// Retrieve operator details from localStorage
const operator = JSON.parse(localStorage.getItem('selectedOperator'));
if (operator) {
  document.getElementById('body-number').textContent = operator.bodyNumber;
  document.getElementById('balance').textContent = operator.balance;
  document.getElementById('uid').textContent = operator.uid;

  // Constants for penalty and initial load
  const penalty = 50.00;
  const initialLoad = 50.00;

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

// Open the modal and populate fields
function openModal() {
  const operator = JSON.parse(localStorage.getItem('selectedOperator')); // Get operator details
  if (!operator) {
    showNotification("No operator selected. Please try again.");
    return;
  }

  // Fetch the total amount to be paid
  const totalAmount = parseFloat(document.getElementById('total-amount').textContent);

  // Populate modal fields
  document.getElementById('balanceInput').value = totalAmount.toFixed(2); // Set the amount
  document.getElementById('bodyNumberInput').value = operator.bodyNumber; // Set the body number (hidden)

  // Display the modal
  document.getElementById("modal-overlay").style.display = "block";
  document.getElementById("pay-fine-modal").style.display = "block";
}


// Close the modal
function closeModal() {
  document.getElementById("modal-overlay").style.display = "none";
  document.getElementById("pay-fine-modal").style.display = "none";
}

// Show notification
function showNotification(message) {
  const notificationBox = document.getElementById("notification-box");
  const notificationMessage = document.getElementById("notification-message");
  notificationMessage.textContent = message;
  notificationBox.style.display = "flex";
}

// Close notification
document.getElementById("close-notification").addEventListener("click", () => {
  document.getElementById("notification-box").style.display = "none";
});

// Placeholder for addBalanceToDB function
async function addBalanceToDB() {
  const bodyNumber = document.getElementById('bodyNumberInput').value; // Get body number from hidden field
  const amount = parseFloat(document.getElementById('balanceInput').value); // Get the amount to be paid

  if (!bodyNumber) {
    showNotification('No body number found. Please try again.');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showNotification('Please enter a valid amount.');
    return;
  }

  const fineAmount = 50; // Fixed fine amount
  const balanceAmount = amount - fineAmount; // Calculate the balance amount

  try {
    // Save the fine payment to the database
    const fineResponse = await fetch('http://localhost:4000/save-fine-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bodyNumber,
        amount: fineAmount, // The fine amount to save
      }),
    });

    const fineResponseText = await fineResponse.text();
    const fineData = JSON.parse(fineResponseText);
    if (!fineResponse.ok || !fineData.success) {
      showNotification(fineData.message || 'Failed to save fine payment.');
      return;
    }

    console.log('Fine payment saved successfully:', fineData);

    if (balanceAmount > 0) {
      const balanceResponse = await fetch('http://localhost:4000/update-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bodyNumber,
          amount: balanceAmount, // The remaining balance to update
        }),
      });

      const balanceResponseText = await balanceResponse.text();
      const balanceData = JSON.parse(balanceResponseText);
      if (!balanceResponse.ok || !balanceData.success) {
        showNotification(balanceData.message || 'Failed to update balance.');
        return;
      }

      console.log('Balance updated successfully:', balanceData);
    }

    showNotification('Payment processed successfully.');
    closeModal(); // Close the modal after successful processing
  } catch (error) {
    console.error('Error processing payment:', error);
    showNotification('An error occurred while processing the payment.');
  }
}

// Modify the close button to navigate to the dashboard after closing
document.getElementById("close-notification").addEventListener("click", () => {
  window.location.href = 'offenders.html'; // Replace with your actual dashboard page URL
}, { once: true }); // Ensure the event is triggered only once