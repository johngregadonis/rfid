document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    // Remove 'active' class from all items
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));

    // Add 'active' class to the clicked item
    item.classList.add('active');

    // Redirect based on menu item text
    if (item.textContent === 'Reload Balance') {
      window.location.href = 'balance.html';
    }
    if (item.textContent === 'North Bound') {
      window.location.href = 'dashboard.html';
    }
    if (item.textContent === 'South Bound') {
      window.location.href = 'southb.html';
    }
    if (item.textContent === 'Register Vehicle') {
      window.location.href = 'add_vehicle.html';
    }
    if (item.textContent === 'Load History') {
      window.location.href = 'load_history.html'; // Redirect to balance.html
    }
  });
});

async function fetchVehicleOperators() {
  try {
    const response = await fetch('http://192.168.1.8:5000/get-vehicle-operators');
    const data = await response.json();

    const tableBody = document.getElementById('vehicle-operators-list');
    tableBody.innerHTML = ''; // Clear previous data

    data.forEach(operator => {
      if (operator.balance < 0) {
        const row = document.createElement('tr');
        row.classList.add('body-number-row'); // Add class for event listener
        row.setAttribute('data-body-number', operator.body_number);
        row.setAttribute('data-name', operator.name);
        row.setAttribute('data-uid', operator.uid);

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

    // Add event listeners for each row
    document.querySelectorAll('.body-number-row').forEach(row => {
      row.addEventListener('click', () => {
        const bodyNumber = row.getAttribute('data-body-number');
        const name = row.getAttribute('data-name');
        const uid = row.getAttribute('data-uid');

        // Save the details to localStorage to share across pages
        localStorage.setItem('selectedOperator', JSON.stringify({ bodyNumber, name, uid }));

        // Redirect to the sidebar page
        window.location.href = 'offenders_details.html';
      });
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('vehicle-operators-list').innerHTML = 
      '<tr><td colspan="4">Failed to load vehicle operators.</td></tr>';
  }
}

fetchVehicleOperators();
