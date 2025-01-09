// Fetch the vehicle operator data from the server
async function fetchVehicleOperators() {
    try {
      const response = await fetch('http://192.168.1.5:5000/get-vehicle-operators');
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        let vehicleList = '';
        data.forEach(operator => {
          vehicleList += 
            `<tr>
              <td>${operator.body_number}</td>
              <td>${operator.uid}</td>
              <td id="balance-${operator.body_number}">₱${operator.balance || 0}</td> <!-- Displaying balance -->
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
      const response = await fetch('http://192.168.1.5:5000/update-balance', {
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
  const response = await fetch('http://192.168.1.5:5000/rfid', {
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

  function showAddBalanceDialog(bodyNumber) {
// Show the modal and overlay
document.getElementById("modal-overlay").style.display = "block";
document.getElementById("add-balance-modal").style.display = "block";

// Set the body number for the modal
document.getElementById("bodyNumberInput").value = bodyNumber;
}

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
      row.classList.remove('highlight');
      if (row.cells[0]?.textContent === bodyNumber) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('highlight');
        found = true;
      }
    });

    if (!found) alert('Body number not found.');
  }
});

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      // Remove 'active' class from all items
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  
      // Add 'active' class to the clicked item
      item.classList.add('active');
  
      // Redirect to 'balance.html' if 'Reload Balance' is clicked
      if (item.textContent === 'North Bound') {
        window.location.href = 'dashboard.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Register Vehicle') {
        window.location.href = 'add_vehicle.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Offenders') {
        window.location.href = 'offenders.html'; // Redirect to balance.html
      }
      if (item.textContent === 'South Bound') {
        window.location.href = 'southb.html'; // Redirect to balance.html
      }
    });
  });
  
  