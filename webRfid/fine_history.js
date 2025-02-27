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
                    paymentDate.setDate(paymentDate.getDate()); // Add 1 day
                    const localDate = paymentDate.toLocaleDateString('en-GB'); // Format to DD/MM/YYYY
                    const weekDay = paymentDate.toLocaleDateString('en-GB', { weekday: 'long' }); // Get weekday
                    loadHistory.push({ ...record, localDate, weekDay });
                });

                // Sort loadHistory by date (latest date first)
                loadHistory.sort((a, b) => new Date(b.date_paid) - new Date(a.date_paid));

                // Create table rows and group totals by date
                let currentDay = '';
                let dailyTotal = 0;
                let dailyTransactionCount = 0;
                loadHistory.forEach(record => {
                    if (record.localDate !== currentDay) {
                        if (currentDay !== '') {
                            const dayTotalRow = document.createElement('tr');
                            dayTotalRow.innerHTML = `
                                <td colspan="3"><div class="day-total"><strong>Total for ${currentDay}:</strong> ₱${dailyTotal.toFixed(2)}</div></td>
    <td colspan="4"><div class="transac">Total Transactions: ${dailyTransactionCount}</div></td>
`;
                            tableBody.appendChild(dayTotalRow);
                        }

                         // Add a gap between different days (empty row)
                         const gapRow = document.createElement('tr');
                         gapRow.innerHTML = `<td colspan="4" style="height: 10px;"></td>`; // Space between days
                         tableBody.appendChild(gapRow);
 

                        currentDay = record.localDate;
                        dailyTotal = 0;
                        dailyTransactionCount = 0;

                        const dayHeaderRow = document.createElement('tr');
                        dayHeaderRow.innerHTML = `
                            <td colspan="4"><div class="day-header"><strong>${record.weekDay}</strong></div></td>
`;
                        tableBody.appendChild(dayHeaderRow);
                    }


                    
                    const amount = parseFloat(record.amount).toFixed(2);
                    dailyTotal += parseFloat(amount); // Add to daily total
                    dailyTransactionCount += 1; // Count transactions

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
                        <td colspan="3"><div class="day-total"><strong>Total for ${currentDay}:</strong> ₱${dailyTotal.toFixed(2)}</div></td>
    <td colspan="4"><div class="transac">Total Transactions: ${dailyTransactionCount}</div></td>
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

        dateSearchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') { // Check if the Enter key is pressed
                const searchTerm = dateSearchInput.value.trim().toLowerCase();
        
                // Reset highlighting
                const rows = tableBody.querySelectorAll('tr');
                rows.forEach(row => row.classList.remove('highlight'));
        
                // If search term exists, filter rows
                if (searchTerm) {
                    let firstMatchScrolled = false; // Track if we've scrolled to the first match
        
                    rows.forEach(row => {
                        const dateCell = row.querySelector('td:nth-child(3)'); // Adjust to your table's column index
                        if (dateCell && dateCell.textContent.toLowerCase().includes(searchTerm)) {
                            row.classList.add('highlight');
        
                            // Scroll to the first matched row
                            if (!firstMatchScrolled) {
                                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                firstMatchScrolled = true;
                            }
                        }
                    });
        
                    // Handle case where no match is found
                    if (!firstMatchScrolled) {
                        console.warn('No matches found');
                    }
                }
            }
        });
});

// Handle menu item clicks
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        // Remove 'active' class from all items
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));

        // Add 'active' class to the clicked item
        item.classList.add('active');

        // Redirect to appropriate page
        const pageMap = {
            'Reload Balance': 'balance.html',
            'Registered Tricycles': 'dashboard.html',
            'North Bound': 'southb.html',
            'Offenders': 'offenders.html',
            'Register Vehicle': 'add_vehicle.html',
            'Load Transaction': 'load_history.html',
            'Register Operator': 'add_tOperator.html',
            'Detected Tricycles': 'detected_tricycle.html'
        };

        const destination = pageMap[item.textContent];
        if (destination) {
            window.location.href = destination;
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
  
    let ws = new WebSocket('ws://localhost:8080');
  
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
            window.location.href = 'admin_login.html'; // ❌ Redirect immediately
        }
    };
  
    ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        setTimeout(() => {
            ws = new WebSocket('ws://localhost:8080');
            ws.onopen = registerTab;
        }, 1000); // ✅ Reconnect after 1 second
    };
  
    window.addEventListener('beforeunload', () => {
        ws.close();
    });
  });
  