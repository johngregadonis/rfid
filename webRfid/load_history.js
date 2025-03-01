document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#loadHistoryTable tbody');
    const noHistoryDiv = document.querySelector('.no-history');
    const dateSearchInput = document.querySelector('#dateSearch');
    let loadHistory = [];

    // Fetch load history from the server
    fetch('http://localhost:5000/get-load-history')
        .then(response => response.json())
        .then(data => {
            console.log('Data from server:', data); // Debug log
            if (data && data.length > 0) {
                // Group data by date
                data.forEach(record => {
                    const transactionDate = new Date(record.transaction_date);
                    const localDate = transactionDate.toLocaleDateString('en-GB'); // Format to DD/MM/YYYY
                    const weekday = transactionDate.toLocaleString('en-US', { weekday: 'long' }); // Get the day of the week
                    loadHistory.push({ ...record, localDate, weekday });
                });

                // Sort loadHistory by date in ascending order (oldest first)
                loadHistory.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

                // Reverse the loadHistory to show the most recent transactions at the top
                loadHistory.reverse();

                // Create table rows and group totals by date
                let currentDay = '';
                let dailyTotal = 0;
                let transactionCount = 0;
                loadHistory.forEach(record => {
                    if (record.localDate !== currentDay) {
                        if (currentDay !== '') {
                            // Append the totals for the previous day (moved to bottom)
                            const dayTotalRow = document.createElement('tr');
                            dayTotalRow.innerHTML = `
                                <td colspan="3"><div class="day-total">Total for ${currentDay}: ₱${dailyTotal.toFixed(2)}</div></td>
    <td colspan="4"><div class="transac">Total Transactions: ${transactionCount}</div></td>
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
                        dailyTotal = 0;
                        transactionCount = 0; // Reset count for the new day
                    }

                    const amount = parseFloat(record.amount).toFixed(2);
                    dailyTotal += parseFloat(amount); // Add to daily total
                    transactionCount++; // Increase transaction count

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${record.body_number}</td>
                        <td>₱${amount}</td>
                        <td>${record.localDate}</td>
                        <td>${record.remarks}</td>
                    `;
                    tableBody.appendChild(tr);
                });

                // Add the last day's total at the bottom
                if (currentDay !== '') {
                    const dayTotalRow = document.createElement('tr');
                    dayTotalRow.innerHTML = `
                        <td colspan="3"><div class="day-total">Total for ${currentDay}: ₱${dailyTotal.toFixed(2)}</div></td>
    <td colspan="4"><div class="transac">Total Transactions: ${transactionCount}</div></td>
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
        

    // Menu item click functionality
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remove 'active' class from all items
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));

            // Add 'active' class to the clicked item
            item.classList.add('active');

            // Redirect to respective pages
            if (item.textContent === 'Reload Balance') {
                window.location.href = 'balance.html'; // Redirect to balance.html
            }
            if (item.textContent === 'Registered Tricycles') {
                window.location.href = 'dashboard.html'; // Redirect to dashboard.html
            }
            if (item.textContent === 'North Bound') {
                window.location.href = 'southb.html'; // Redirect to southb.html
            }
            if (item.textContent === 'Offenders') {
                window.location.href = 'offenders.html'; // Redirect to offenders.html
            }
            if (item.textContent === 'Register Vehicle') {
                window.location.href = 'add_vehicle.html'; // Redirect to add_vehicle.html
            }
            if (item.textContent === 'Penalty Transaction') {
                window.location.href = 'fine_history.html'; // Redirect to fine_history.html
            }
            if (item.textContent === 'Register Operator') {
                window.location.href = 'add_tOperator.html'; // Redirect to add_tOperator.html
            }
            if (item.textContent === 'Detected Tricycles') {
                window.location.href = 'detected_tricycle.html'; // Redirect to detected_tricycle.html
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
  
  // Call function when page loads
  window.onload = fetchProfile;
  
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
  