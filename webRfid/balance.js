// Fetch the vehicle operator data from the server
async function fetchVehicleOperators() {
  try {
      const response = await fetch('http://localhost:4000/get-vehicle-operators');
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
          let vehicleList = '';
          data.forEach(operator => {
              const balanceColor = operator.balance <= 0 ? 'red' : 'black'; // Set color based on balance
              vehicleList += `
                  <tr>
                      <td>${operator.body_number}</td>
                      <td>${operator.uid}</td>
                      <td id="balance-${operator.body_number}" style="color: ${balanceColor};">₱${operator.balance || 0}</td>
                      <td>
                          <button onclick="showAddBalanceDialog(${operator.body_number})">Add Balance</button>
                      </td>
                  </tr>`;
          });
          document.getElementById('vehicle-operators-list').innerHTML = vehicleList;
      } else {
          document.getElementById('vehicle-operators-list').innerHTML = '<tr><td colspan="4">No operators found.</td></tr>';
      }
  } catch (error) {
      console.error('Error fetching data:', error);
      document.getElementById('vehicle-operators-list').innerHTML = '<tr><td colspan="4">Failed to load vehicle operators.</td></tr>';
  }
}


  // Show the modal dialog to add balance
  function showAddBalanceDialog(bodyNumber) {
    document.getElementById('add-balance-modal').style.display = 'block';
    document.getElementById('bodyNumberInput').value = bodyNumber;
  }

  // Hide the modal dialog
  function closeAddBalanceDialog() {
    document.getElementById('add-balance-modal').style.display = 'none';
  }
//add balance
async function addBalanceToDB() {
  const bodyNumber = document.getElementById('bodyNumberInput').value;
  const amount = parseFloat(document.getElementById('balanceInput').value);

  if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
  }

  try {
      const response = await fetch('http://localhost:4000/update-balance', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bodyNumber, amount }),
      });

      const data = await response.json();
      console.log('Response from server:', data); // Log the response

      if (response.ok && data.success && typeof data.newBalance === 'number') {
          const balanceElement = document.getElementById(`balance-${bodyNumber}`);
          balanceElement.innerText = `₱${data.newBalance.toFixed(2)}`;
          
          // Update the balance color based on the new balance value
          const balanceColor = data.newBalance > 0 ? 'black' : 'red';
          balanceElement.style.color = balanceColor;

          closeAddBalanceDialog();
      } else {
          console.error('Failed condition:', {
              ok: response.ok,
              success: data.success,
              newBalanceType: typeof data.newBalance,
          });
          alert(data.message || 'Failed to update balance.');
      }
  } catch (error) {
      console.error('Error adding balance:', error);
      alert('An error occurred while adding the balance.');
  }
}

//diminish balance
  async function updateBalance(uid) {
try {
  const response = await fetch('http://localhost:4000/rfid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid }),
  });

  const data = await response.json();

  if (response.ok) {
    // Find the corresponding balance cell and update it
    const operator = document.querySelector(`td[data-uid="${uid}"]`);
    if (operator) {
      const balanceCell = operator.nextElementSibling;
      balanceCell.innerText = `₱${data.newBalance.toFixed(2)}`;
    }
    alert('Balance updated successfully.');
  } else {
    alert(data.error || 'Failed to update balance.');
  }
} catch (error) {
  console.error('Error updating balance:', error);
  alert('Error updating balance.');
}
}


  // Call fetchVehicleOperators when the page loads
  window.onload = fetchVehicleOperators;

// Show the modal dialog to add balance with condition
function showAddBalanceDialog(bodyNumber) {
  // Get the current balance for the operator
  const balanceElement = document.getElementById(`balance-${bodyNumber}`);
  const currentBalance = parseFloat(balanceElement.innerText.replace('₱', ''));

  // Check if the balance is negative
  if (currentBalance < 0) {
      // Show the notification box
      showNotification('The fine must be paid first before reloading.');
      return;
  }

  // Show the modal and overlay
  document.getElementById("modal-overlay").style.display = "block";
  document.getElementById("add-balance-modal").style.display = "block";

  // Set the body number for the modal
  document.getElementById("bodyNumberInput").value = bodyNumber;
}

// Show the notification box with a message
function showNotification(message) {
  const notificationBox = document.getElementById('notification-box');
  const notificationMessage = document.getElementById('notification-message');
  
  // Set the message text
  notificationMessage.textContent = message;
  
  // Display the notification box
  notificationBox.style.display = 'flex'; // Matches the flex display in CSS
}

// Close the notification box
document.getElementById('close-notification').addEventListener('click', () => {
  const notificationBox = document.getElementById('notification-box');
  notificationBox.style.display = 'none';
});


function closeAddBalanceDialog() {
// Hide the modal and overlay
document.getElementById("modal-overlay").style.display = "none";
document.getElementById("add-balance-modal").style.display = "none";
}

document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.querySelector('.search-bar input');
  const vehicleTable = document.getElementById('vehicle-operators-list');

  // Create a suggestion box
  const suggestionBox = document.createElement('div');
  suggestionBox.className = 'suggestion-box';
  document.querySelector('.search-bar').appendChild(suggestionBox);

  // Handle input in search bar
  searchBar.addEventListener('input', () => {
    const query = searchBar.value.trim();
    if (query === '') {
      suggestionBox.innerHTML = '';
      suggestionBox.style.display = 'none';
      return;
    }

    const rows = vehicleTable.querySelectorAll('tr');
    const matches = Array.from(rows).filter(row =>
      row.cells[0]?.textContent.includes(query)
    );

    suggestionBox.innerHTML = matches
      .map(match => `<div class="suggestion">${match.cells[0].textContent}</div>`)
      .join('');
    suggestionBox.style.display = matches.length > 0 ? 'block' : 'none';

    // Add click event for suggestions
    suggestionBox.querySelectorAll('.suggestion').forEach(item => {
      item.addEventListener('click', () => {
        searchBar.value = item.textContent;
        suggestionBox.style.display = 'none';
        highlightRow(item.textContent);

        // Clear the search bar after selection
        searchBar.value = '';
      });
    });
  });

  // Handle Enter key in search bar
  searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchBar.value.trim();
      if (query !== '') highlightRow(query);
    }
  });

  // Highlight the row matching the body number
  function highlightRow(bodyNumber) {
    const rows = vehicleTable.querySelectorAll('tr');
    let found = false;

    rows.forEach(row => {
      row.classList.remove('highlight'); // Remove highlight from all rows

      const bodyNumberCell = row.cells[0]; // Check the first cell
      if (bodyNumberCell && bodyNumberCell.textContent.trim() === bodyNumber) {
        console.log("Match found! Highlighting row:", bodyNumber); // Debugging line
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('highlight');
        found = true;
      }
    });

    if (!found) {
      alert('Body number not found.');
      console.log("No match found for:", bodyNumber); // Debugging line
    }

    // Clear the search bar
    searchBar.value = '';
  }
});


document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      // Remove 'active' class from all items
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  
      // Add 'active' class to the clicked item
      item.classList.add('active');
  
      // Redirect to 'balance.html' if 'Reload Balance' is clicked
      if (item.textContent === 'Registered Vehicles') {
        window.location.href = 'dashboard.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Register Tricycle') {
        window.location.href = 'add_vehicle.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Offenders') {
        window.location.href = 'offenders.html'; // Redirect to balance.html
      }
      if (item.textContent === 'North Bound') {
        window.location.href = 'southb.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Load History') {
        window.location.href = 'load_history.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Fine Payment History') {
        window.location.href = 'fine_history.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Register Terminal Operator') {
        window.location.href = 'add_tOperator.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Detected Tricycles') {
        window.location.href = 'detected_tricycle.html'; // Redirect to balance.html
      }
    });
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    const tabIdKey = 'dashboard_tab_id';
    let tabId = sessionStorage.getItem(tabIdKey);
  
    // ✅ Generate a unique ID for this tab if it doesn't have one
    if (!tabId) {
        tabId = Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem(tabIdKey, tabId);
    }
  
    let ws = new WebSocket('ws://localhost:8081');
  
    function registerTab() {
        ws.send(JSON.stringify({ type: 'register', tabId: tabId }));
    }
  
    ws.onopen = () => {
        console.log('Connected to WebSocket server');
        registerTab();
    };
  
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.error) {
            window.location.href = 'login.html'; // ❌ Redirect immediately
        }
    };
  
    ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        setTimeout(() => {
            ws = new WebSocket('ws://localhost:8081');
            ws.onopen = registerTab;
        }, 1000); // ✅ Reconnect after 1 second
    };
  
    window.addEventListener('beforeunload', () => {
        ws.close();
    });
  });
  