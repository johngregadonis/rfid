document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#loadHistoryTable tbody');
    const noHistoryDiv = document.querySelector('.no-history');
    const dateSearchInput = document.querySelector('#dateSearch');
    let loadHistory = [];

    // Fetch load history from the server
    fetch('http://192.168.1.7:5000/get-load-history')
        .then(response => response.json())
        .then(data => {
            console.log('Data from server:', data); // Debug log
            if (data && data.length > 0) {
                // Group data by date
                data.forEach(record => {
                    const transactionDate = new Date(record.transaction_date);
                    const localDate = transactionDate.toLocaleDateString('en-GB'); // Format to DD/MM/YYYY
                    loadHistory.push({ ...record, localDate });
                });

                // Sort loadHistory by date in ascending order (oldest first)
                loadHistory.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

                // Reverse the loadHistory to show the most recent transactions at the top
                loadHistory.reverse();

                // Create table rows and group totals by date
                let currentDay = '';
                let dailyTotal = 0;
                loadHistory.forEach(record => {
                    if (record.localDate !== currentDay) {
                        if (currentDay !== '') {
                            const dayTotalRow = document.createElement('tr');
                            dayTotalRow.innerHTML = `
                                <td colspan="3" class="day-total">Total for ${currentDay}: ₱${dailyTotal.toFixed(2)}</td>
                                <td></td>
                            `;
                            tableBody.appendChild(dayTotalRow);
                        }

                        currentDay = record.localDate;
                        dailyTotal = 0;
                    }

                    const amount = parseFloat(record.amount).toFixed(2);
                    dailyTotal += parseFloat(amount); // Add to daily total

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${record.body_number}</td>
                        <td>₱${amount}</td>
                        <td>${record.localDate}</td>
                        <td>Added successfully</td>
                    `;
                    tableBody.appendChild(tr);
                });

                // Add the last day's total
                if (currentDay !== '') {
                    const dayTotalRow = document.createElement('tr');
                    dayTotalRow.innerHTML = `
                        <td colspan="3" class="day-total">Total for ${currentDay}: ₱${dailyTotal.toFixed(2)}</td>
                        <td></td>
                    `;
                    tableBody.appendChild(dayTotalRow);
                }
            } else {
                noHistoryDiv.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching load history:', error);
            noHistoryDiv.style.display = 'block';
        });

    // Search functionality
    dateSearchInput.addEventListener('input', () => {
        const searchTerm = dateSearchInput.value.trim().toLowerCase();

        // Reset highlighting
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            row.classList.remove('highlight');
        });

        // If search term exists, filter rows
        if (searchTerm) {
            let found = false;
            rows.forEach(row => {
                const dateCell = row.querySelector('td:nth-child(3)'); // Transaction Date column
                if (dateCell && dateCell.textContent.toLowerCase().includes(searchTerm)) {
                    row.classList.add('highlight');
                    // Scroll to the matched row
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    found = true;
                }
            });

            // If no row is found, ensure the table stays at its current position
            if (!found) {
                tableBody.scrollTop = 0; // Optionally reset scroll if no match
            }
        }
    });
});

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      // Remove 'active' class from all items
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  
      // Add 'active' class to the clicked item
      item.classList.add('active');
  
      // Redirect to different pages based on the menu item clicked
      if (item.textContent === 'Reload Balance') {
        window.location.href = 'balance.html'; 
      }
      if (item.textContent === 'North Bound') {
        window.location.href = 'dashboard.html'; 
      }
      if (item.textContent === 'South Bound') {
        window.location.href = 'southb.html'; 
      }
      if (item.textContent === 'Offenders') {
        window.location.href = 'offenders.html'; 
      }
      if (item.textContent === 'Register Vehicle') {
        window.location.href = 'add_vehicle.html'; 
      }
      if (item.textContent === 'Detected Tricycle') {
        window.location.href = 'detected_tricycle.html'; 
      }
    });
});
