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
      if (item.textContent === 'South Bound') {
        window.location.href = 'southb.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Register Vehicle') {
        window.location.href = 'add_vehicle.html'; // Redirect to balance.html
      }
    });
  });
  
  async function fetchVehicleOperators() {
    try {
      const response = await fetch('http://192.168.1.5:5000/get-vehicle-operators');
      const data = await response.json();
      
      const tableBody = document.getElementById('vehicle-operators-list');
      tableBody.innerHTML = ''; // Clear previous data
  
      data.forEach(operator => {
        if (operator.balance < 0) {
          const row = document.createElement('tr');
          
          const bodyNumberCell = document.createElement('td');
          bodyNumberCell.textContent = operator.body_number;
          
          const nameCell = document.createElement('td');
          nameCell.textContent = operator.name;
          
          const uidCell = document.createElement('td');
          uidCell.textContent = operator.uid;
          
          const offenseCell = document.createElement('td');
          offenseCell.textContent = 'Insufficient Balance';
          
          row.appendChild(bodyNumberCell);
          row.appendChild(nameCell);
          row.appendChild(uidCell);
          row.appendChild(offenseCell);
          
          tableBody.appendChild(row);
        }
      });
    } catch (error) {
      console.error('Error fetching vehicle operators:', error);
    }
  }
  
  fetchVehicleOperators();
  