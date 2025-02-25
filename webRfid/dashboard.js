document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    // Remove 'active' class from all items
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));

    // Add 'active' class to the clicked item
    item.classList.add('active');

    // Redirect to 'balance.html' if 'Reload Balance' is clicked
  
    if (item.textContent === 'North Bound') {
      window.location.href = 'southb.html'; // Redirect to balance.html
    }
    
    if (item.textContent === 'Detected Tricycle') {
      window.location.href = 'detected_tricycle.html'; // Redirect to balance.html
    }
  });
});

/// Fetch the data when the page loads
document.addEventListener('DOMContentLoaded', fetchVehicleOperators);

// Fetch the vehicle operator data from the server
async function fetchVehicleOperators() {
  try {
    const response = await fetch('http://localhost:2000/get-vehicle-operators');
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      let vehicleList = '';
      data.forEach(operator => {
        const balance = parseFloat(operator.balance);
        let balanceClass = balance <= 10 ? 'red' : balance <= 30 ? 'yellow' : 'green';

        // Create table row with data attributes for operator details
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

      
    } else {
      document.getElementById('vehicle-operators-list').innerHTML = '<tr><td colspan="3">No operators found.</td></tr>';
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('vehicle-operators-list').innerHTML = '<tr><td colspan="3">Failed to load vehicle operators.</td></tr>';
  }
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