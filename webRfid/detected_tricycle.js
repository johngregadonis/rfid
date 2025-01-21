// Function to get current time in Manila timezone and format it
function getFormattedDateInManila() {
    const currentDate = new Date();
    const timezone = 'Asia/Manila';
    const manilaTime = new Date(currentDate.toLocaleString('en-US', { timeZone: timezone }));
    const dateSearchInput = document.querySelector('#dateSearch');

    // Format to the desired format: "Sun, 19/01/2025, 08:00:00"
    const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
        weekday: 'short', // Example: Sun
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour12: false, // 24-hour format
        timeZone: timezone
    });

    return dateTimeFormat.format(manilaTime);
}

// Function to fetch detected tricycles data
async function fetchDetectedTricycles() {
    try {
        const response = await fetch('http://192.168.1.7:5000/detected-tricycles');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const tableBody = document.getElementById('tricycle-data');
        let totalTimesDetected = 0;

        tableBody.innerHTML = ''; // Clear table before populating

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">No data available</td></tr>';
            return;
        }

        const currentManilaTime = getFormattedDateInManila();

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.body_number}</td>
                <td>${currentManilaTime}</td>
                <td>${row.times_detected}</td>
            `;
            tableBody.appendChild(tr);

            totalTimesDetected += row.times_detected;
        });

        document.getElementById('total-times').textContent = `Total Times Detected: ${totalTimesDetected}`;
        console.log('Data successfully loaded:', data);

    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('tricycle-data').innerHTML = 
            '<tr><td colspan="3">Error loading data</td></tr>';
    }
}

// Search functionality
const dateSearchInput = document.querySelector('#dateSearch');
const tableBody = document.getElementById('tricycle-data');

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
            const dateCell = row.querySelector('td:nth-child(2)'); // Date column
            if (dateCell && dateCell.textContent.toLowerCase().includes(searchTerm)) {
                row.classList.add('highlight');
            }
        });
    }
});

// Fetch data when page loads
window.onload = fetchDetectedTricycles;

// Handle menu item clicks and navigation
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const pageRoutes = {
            'Reload Balance': 'balance.html',
            'North Bound': 'dashboard.html',
            'South Bound': 'southb.html',
            'Offenders': 'offenders.html',
            'Register Vehicle': 'add_vehicle.html',
            'Load History': 'load_history.html'
        };

        if (pageRoutes[item.textContent]) {
            window.location.href = pageRoutes[item.textContent];
        }
    });
});
//old 