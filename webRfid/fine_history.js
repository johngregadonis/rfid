document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#loadHistoryTable tbody');
    const noHistoryDiv = document.querySelector('.no-history');
    const dateSearchInput = document.querySelector('#dateSearch');
    let loadHistory = [];

    // Fetch fine payment data from the server
    fetch('http://localhost:5000/fine-payments')
        .then(response => response.json())
        .then(data => {
            console.log('Data from server:', data); // Debug log
            if (data && data.length > 0) {
                // Group data by date
                data.forEach(record => {
                    const paymentDate = new Date(record.date_paid);
                    paymentDate.setDate(paymentDate.getDate() + 1); // Add 1 day
                    const localDate = paymentDate.toLocaleDateString('en-GB'); // Format to DD/MM/YYYY
                    loadHistory.push({ ...record, localDate });
                });

                // Sort loadHistory by date
                loadHistory.sort((a, b) => new Date(a.date_paid) - new Date(b.date_paid));

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
                        <td>${record.time_paid}</td>
                        <td>${record.localDate}</td>
                        <td>₱${amount}</td>
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
            console.error('Error fetching fine payment history:', error);
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
            rows.forEach(row => {
                const dateCell = row.querySelector('td:nth-child(3)'); // Transaction Date column
                if (dateCell && dateCell.textContent.toLowerCase().includes(searchTerm)) {
                    row.classList.add('highlight');
                }
            });
        }
    });
});

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        // Remove 'active' class from all items
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));

        // Add 'active' class to the clicked item
        item.classList.add('active');

        // Redirect to appropriate page
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
        if (item.textContent === 'Load History') {
            window.location.href = 'load_history.html';
        }
        if (item.textContent === 'Register Terminal Operator') {
            window.location.href = 'add_tOperator.html'; // Redirect to balance.html
          }
          if (item.textContent === 'Detected Tricycle') {
            window.location.href = 'detected_tricycle.html'; // Redirect to balance.html
          }
    });
});
