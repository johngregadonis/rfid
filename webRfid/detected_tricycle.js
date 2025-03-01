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
                              <td colspan="2"><div class="day-total">Total for ${currentDay}: ${totalTimesDetected}</div></td>
    <td colspan="2"><div class="transac">Total detected body number: ${recordCount}</div></td>
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
                           <td colspan="4"><div class="static-date">${record.weekday}</div></td>
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
                          <td colspan="2"><div class="day-total">Total for ${currentDay}: ${totalTimesDetected}</div></td>
    <td colspan="2"><div class="transac">Total detected body number: ${recordCount}</div></td>
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
                'Registered Tricycles': 'dashboard.html',
                'North Bound': 'southb.html',
                'Offenders': 'offenders.html',
                'Register Tricycle': 'add_vehicle.html',
                'Register Operator': 'add_tOperator.html',
                'Load Transaction': 'load_history.html',
                'Penalty Transaction': 'fine_history.html'
            };

            if (pageRoutes[item.textContent]) {
                window.location.href = pageRoutes[item.textContent];
            }
        });
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
  
  //profile
document.addEventListener("DOMContentLoaded", function () {
    const profileIcon = document.getElementById("profileIcon");
    const sidebar = document.getElementById("right-sidebar");
    const closeBtn = document.getElementById("closeBtn");
    const overlay = document.getElementById("overlays");
    const toggleChangePassword = document.getElementById("toggleChangePassword");
    const changePasswordForm = document.getElementById("changePasswordForm");
    const logoutOption = document.getElementById("logoutOption");
  
    let isPasswordFormVisible = false;
  
    // Open Sidebar
    profileIcon.addEventListener("click", function () {
        sidebar.style.right = "0";
        overlay.style.display = "block"; // Show overlay
    });
  
    // Close Sidebar
    function closeSidebar() {
        sidebar.style.right = "-300px";
        overlay.style.display = "none"; // Hide overlay
    }
  
    closeBtn.addEventListener("click", closeSidebar);
    overlay.addEventListener("click", closeSidebar);
  
    // Toggle Change Password Form
    toggleChangePassword.addEventListener("click", function () {
        isPasswordFormVisible = !isPasswordFormVisible;
  
        if (isPasswordFormVisible) {
            changePasswordForm.style.display = "flex";
            logoutOption.style.marginTop = "20px"; // Move logout down
        } else {
            changePasswordForm.style.display = "none";
            logoutOption.style.marginTop = "0"; // Reset logout position
        }
    });
  });
  
  //fetch profile name
  async function fetchProfile() {
    const token = localStorage.getItem('token'); // Get JWT token from localStorage
  
    if (!token) {
        alert('Unauthorized: Please log in again.');
        window.location.href = 'login.html';
        return;
    }
  
    try {
        const response = await fetch('http://localhost:5000/api/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
  
        const data = await response.json();
  
        if (response.ok) {
            // Update the profile name dynamically
            document.querySelector('.profile-container p').textContent = data.name;
        } else {
            alert(data.message || 'Failed to load profile');
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Something went wrong. Please try again.');
    }
  }
  
  //change-pass
  document.getElementById('changePasswordBtn').addEventListener('click', async function () {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
  
    const token = localStorage.getItem('token'); // Get JWT token
  
    if (!token) {
        showNotification('Unauthorized: Please log in again.');
        window.location.href = 'login.html';
        return;
    }
  
    try {
        const response = await fetch('http://localhost:5000/api/change-password', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
        });
  
        const data = await response.json();
  
        if (response.ok) {
            showNotification(data.message); // Show success message
            setTimeout(() => window.location.reload(), 3000); // Reload after 3s
        } else {
            showNotification(data.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Something went wrong. Please try again.');
    }
  });
  
  function showNotification(message) {
    const notificationBox = document.getElementById('notification-box');
    const notificationMessage = document.getElementById('notification-message');
  
    notificationMessage.textContent = message; // Set the message
    notificationBox.style.display = 'block'; // Show the notification box
  
    // Auto-hide after 3 seconds
    setTimeout(() => {
        
        notificationBox.style.display = "flex";
    });
  
  }
  
  // Close notification manually
  document.getElementById('close-notification').addEventListener('click', function () {
    document.getElementById('notification-box').style.display = 'none';
  });
  
  //logout
  document.getElementById('logoutOption').addEventListener('click', function () {
    showLogoutConfirmation();
  });
  
  function showLogoutConfirmation() {
    const notificationsBox = document.getElementById('notifications-box');
    const notificationsMessage = document.getElementById('notifications-message');
    
    notificationsMessage.textContent = 'Are you sure you want to logout?';
    
    // Show the notification box
    notificationsBox.style.display = 'flex';
    
    // Add event listener for "Yes" button
    document.getElementById('confirm-yes').onclick = function () {
        localStorage.removeItem('token'); // Remove token
        window.location.href = 'admin_login.html'; // Redirect to login page
    };
  
    // Add event listener for "No" button
    document.getElementById('confirm-no').onclick = function () {
        notificationsBox.style.display = 'none'; // Close the notification
    };
  }
  

window.onload = function () {
    fetchProfile();
    fetchDetectedTricycles();
   
};
