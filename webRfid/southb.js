document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    // Remove 'active' class from all items
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));

    // Add 'active' class to the clicked item
    item.classList.add('active');

    // Redirect to different pages based on menu selection
    if (item.textContent === 'Reload Balance') {
      window.location.href = 'balance.html';
    }
    if (item.textContent === 'Registered Vehicles') {
      window.location.href = 'dashboard.html';
    }
    if (item.textContent === 'Offenders') {
      window.location.href = 'offenders.html';
    }
    if (item.textContent === 'Register Vehicle') {
      window.location.href = 'add_vehicle.html';
    }
    if (item.textContent === 'Load History') {
      window.location.href = 'load_history.html';
    }
    if (item.textContent === 'Fine Payment History') {
      window.location.href = 'fine_history.html';
    }
    if (item.textContent === 'Register Terminal Operator') {
      window.location.href = 'add_tOperator.html';
    }
    if (item.textContent === 'Detected Tricycle') {
      window.location.href = 'detected_tricycle.html';
    }
  });
});

document.addEventListener('DOMContentLoaded', startDetectionCheck);

let detectedVehicles = JSON.parse(localStorage.getItem('detectedVehicles')) || [];

async function startDetectionCheck() {
updateDisplay(); // Show stored vehicles on load
setInterval(fetchDetectedVehicle, 1000); // Poll every 3 seconds
}

async function fetchDetectedVehicle() {
  try {
    const response = await fetch('http://localhost:5000/get-detected-vehicle');

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No recently detected vehicle found");
        detectedVehicles = []; // Clear detected vehicles
        localStorage.setItem('detectedVehicles', JSON.stringify(detectedVehicles));
        updateDisplay(); // Refresh UI to show nothing
        return;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched detected vehicle:", data);

    if (data && data.body_number) {
      // Prevent duplicates
      detectedVehicles = detectedVehicles.filter(v => v.body_number !== data.body_number);
      detectedVehicles.unshift(data);

      localStorage.setItem('detectedVehicles', JSON.stringify(detectedVehicles));
      updateDisplay();
    }
  } catch (error) {
    console.error('Error fetching detected vehicle:', error);
  }
}


function updateDisplay() {
let vehicleList = '';

detectedVehicles.forEach(operator => {
  const balance = parseFloat(operator.balance);
  let balanceClass = balance <= 10 ? 'red' : balance <= 30 ? 'yellow' : 'green';

  vehicleList += 
    `<tr class="body-number-row" 
         data-body-number="${operator.body_number}" 
         data-balance="${operator.balance}" 
         data-uid="${operator.uid}">
      <td>${operator.body_number}</td>
      <td>${operator.uid}</td>
      <td class="${balanceClass}"></td>
    </tr>`;
});

document.getElementById('vehicle-operators-list').innerHTML = vehicleList;

// Add event listeners for each row (Inserted function)
document.querySelectorAll('.body-number-row').forEach(row => {
  row.addEventListener('click', () => {
    const bodyNumber = row.getAttribute('data-body-number');
    const balance = row.getAttribute('data-balance');
    const uid = row.getAttribute('data-uid');

    // Save the details to localStorage or sessionStorage to share across pages
    localStorage.setItem('selectedOperator', JSON.stringify({ bodyNumber, balance, uid }));

    // Redirect to the sidebar page
    window.location.href = 'operator_details.html';
  });
});
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
