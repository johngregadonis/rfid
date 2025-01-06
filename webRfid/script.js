document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

async function fetchVehicleOperators() {
  try {
    const response = await fetch('http://192.168.1.5:5000/get-vehicle-operators'); // Ensure the URL is correct
    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log('Fetched Data:', data); // Log the data to verify it’s fetched correctly

    const tableContent = document.querySelector('.table-content');
    tableContent.innerHTML = ''; // Clear existing content

    data.forEach((operator) => {
      const row = document.createElement('div');
      row.classList.add('table-row');
      row.innerHTML = `
        <div>${operator.body_number}</div>
        <div>${operator.name || 'N/A'}</div>
        <div>${operator.uid}</div>
        <div id="balance-${operator.body_number}">₱${operator.balance || 0}</div>
      `;
      tableContent.appendChild(row);
    });
  } catch (error) {
    console.error('Fetch Error:', error);
  }
}

// Fetch the data when the page loads
document.addEventListener('DOMContentLoaded', fetchVehicleOperators);
