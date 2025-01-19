document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      // Remove 'active' class from all items
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  
      // Add 'active' class to the clicked item
      item.classList.add('active');
  
      // Redirect to 'balance.html' if 'Reload Balance' is clicked
      if (item.textContent === 'Reload Balance') {
        window.location.href = 'balance.html'; // Redirect to balance.html
      }
      if (item.textContent === 'North Bound') {
        window.location.href = 'dashboard.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Offenders') {
        window.location.href = 'offenders.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Register Vehicle') {
        window.location.href = 'add_vehicle.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Load History') {
        window.location.href = 'load_history.html'; // Redirect to balance.html
      }
    });
  });
  
  /// Fetch the data when the page loads
  document.addEventListener('DOMContentLoaded', fetchVehicleOperators);
  
  // Fetch the vehicle operator data from the server
  async function fetchVehicleOperators() {
    try {
      const response = await fetch('http://192.168.1.8:5000/get-vehicle-operators');
      const data = await response.json();
  
      if (Array.isArray(data) && data.length > 0) {
        let vehicleList = '';
        data.forEach(operator => {
          const balance = parseFloat(operator.balance);
          let balanceClass = balance <= 10 ? 'red' : balance <= 50 ? 'yellow' : 'green';
  
          // Create table row with data attributes for operator details
          vehicleList += 
            `<tr class="body-number-row" 
                 data-body-number="${operator.body_number}" 
                 data-name="${operator.name}" 
                 data-uid="${operator.uid}">
              <td>${operator.body_number}</td>
              <td>${operator.name}</td>
              <td>${operator.uid}</td>
              <td class="${balanceClass}"></td>
            </tr>`;
        });
        document.getElementById('vehicle-operators-list').innerHTML = vehicleList;
  
        // Add event listeners for each row
        document.querySelectorAll('.body-number-row').forEach(row => {
          row.addEventListener('click', () => {
            const bodyNumber = row.getAttribute('data-body-number');
            const name = row.getAttribute('data-name');
            const uid = row.getAttribute('data-uid');
  
            // Save the details to localStorage or sessionStorage to share across pages
            localStorage.setItem('selectedOperator', JSON.stringify({ bodyNumber, name, uid }));
  
            // Redirect to the sidebar page
            window.location.href = 'operator_details.html';
          });
        });
      } else {
        document.getElementById('vehicle-operators-list').innerHTML = '<tr><td colspan="4">No operators found.</td></tr>';
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      document.getElementById('vehicle-operators-list').innerHTML = '<tr><td colspan="4">Failed to load vehicle operators.</td></tr>';
    }
  }