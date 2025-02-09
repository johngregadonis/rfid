document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#detectedTricyclesTable tbody'); // Correct table reference
    const noHistoryDiv = document.querySelector('.no-history');
    const dateSearchInput = document.querySelector('#dateSearch');
    let detectedTricycles = [];

    // Fetch detected tricycles from the server
    fetch('http://localhost:5000/detected-tricycles')
        .then(response => response.json())
        .then(data => {
            console.log('Data from server:', data); // Debug log
            if (data && data.length > 0) {
                // Group data by date
                data.forEach(record => {
                    const detectionDate = new Date(record.date_detected);
                    const localDate = detectionDate.toLocaleDateString('en-GB'); // Format to DD/MM/YYYY
                    const weekday = detectionDate.toLocaleString('en-US', { weekday: 'long' }); // Get the day of the week
                    detectedTricycles.push({ ...record, localDate, weekday });
                });

                // Sort detectedTricycles by date in ascending order (oldest first)
                detectedTricycles.sort((a, b) => new Date(a.date_detected) - new Date(b.date_detected));

                // Reverse to show most recent transactions at the top
                detectedTricycles.reverse();

                // Create table rows and group totals by date
                let currentDay = '';
                let totalTimesDetected = 0;
                let recordCount = 0;
                detectedTricycles.forEach(record => {
                    if (record.localDate !== currentDay) {
                        if (currentDay !== '') {
                            // Append the totals for the previous day (moved to bottom)
                            const dayTotalRow = document.createElement('tr');
                            dayTotalRow.innerHTML = `
                                <td colspan="2" class="day-total">Total for ${currentDay}: ${totalTimesDetected}</td>
                                <td colspan="2" class="transac">Total detected body number: ${recordCount}</td>
                            `;
                            tableBody.appendChild(dayTotalRow);
                        }

                        // Add a gap between different days (empty row)
                        const gapRow = document.createElement('tr');
                        gapRow.innerHTML = `<td colspan="4" style="height: 10px;"></td>`; // Space between days
                        tableBody.appendChild(gapRow);

                        // Add the weekday at the top of the new day
                        const staticDateRow = document.createElement('tr');
                        staticDateRow.innerHTML = `
                            <td colspan="4" class="static-date">${record.weekday}</td>
                        `;
                        tableBody.appendChild(staticDateRow);

                        currentDay = record.localDate;
                        totalTimesDetected = 0;
                        recordCount = 0; // Reset count for the new day
                    }

                    totalTimesDetected += record.times_detected; // Add to total times detected
                    recordCount++; // Increase record count

                    const formattedDate = new Date(record.date_detected).toLocaleDateString('en-GB'); // Format date to DD/MM/YYYY
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${record.body_number}</td>
                        <td>${formattedDate}</td> <!-- Display the formatted date -->
                        <td>${record.times_detected}</td>
                    `;
                    tableBody.appendChild(tr);
                });

                // Add the last day's total at the bottom
                if (currentDay !== '') {
                    const dayTotalRow = document.createElement('tr');
                    dayTotalRow.innerHTML = `
                        <td colspan="2" class="day-total">Total for ${currentDay}: ${totalTimesDetected}</td>
                        <td colspan="2" class="transac">Total detected body number: ${recordCount}</td>
                    `;
                    tableBody.appendChild(dayTotalRow);
                }
            } else {
                noHistoryDiv.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching detected tricycles:', error);
            noHistoryDiv.style.display = 'block';
        });

    // Search functionality for detected tricycles
dateSearchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { // Check if the Enter key is pressed
        const searchTerm = dateSearchInput.value.trim().toLowerCase();

        // Reset highlighting
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => row.classList.remove('highlight'));

        let matchedRow = null;

        // If search term exists, filter rows
        if (searchTerm) {
            rows.forEach(row => {
                const dateCell = row.querySelector('td:nth-child(2)'); // Date column (adjust index as necessary)
                if (dateCell && dateCell.textContent.toLowerCase().includes(searchTerm)) {
                    row.classList.add('highlight');
                    if (!matchedRow) {
                        matchedRow = row; // Get the first matched row
                    }
                }
            });

            // Scroll to the first matched row if found
            if (matchedRow) {
                matchedRow.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'  // Scroll the matched row into the center of the viewport
                });
            } else {
                console.warn('No matches found');
            }
        }
    }
});

    // Menu item click functionality (no changes needed)
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Handle redirection
            const pageRoutes = {
                'Reload Balance': 'balance.html',
                'Registered Vehicles': 'dashboard.html',
                'North Bound': 'southb.html',
                'Offenders': 'offenders.html',
                'Register Vehicle': 'add_vehicle.html',
                'Register Terminal Operator': 'add_tOperator.html',
                'Load History': 'load_history.html',
                'Fine Payment History': 'fine_history.html'
            };

            if (pageRoutes[item.textContent]) {
                window.location.href = pageRoutes[item.textContent];
            }
        });
    });
});

// Fetch data when page loads
window.onload = fetchDetectedTricycles;