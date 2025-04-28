let backendUrl = ''; // Global variable to store the backend URL

// Fetch the backend URL when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/get-backend-url');
        const data = await response.json();
        backendUrl = data.backendUrl;
        console.log("Backend URL Loaded:", backendUrl);

        // Call functions that depend on backendUrl after it's set
        fetchVehicleOperators();
        fetchProfile();
    } catch (error) {
        console.error('Error fetching backend URL:', error);
    }
});

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
    if (item.textContent === 'Registered Vehicles') {
      window.location.href = 'dashboard.html';
    }
    if (item.textContent === 'North Bound') {
      window.location.href = 'southb.html';
    }
    if (item.textContent === 'Register Tricycle') {
      window.location.href = 'add_vehicle.html';
    }
    if (item.textContent === 'Load History') {
      window.location.href = 'load_history.html'; // Redirect to balance.html
    }
    if (item.textContent === 'Fine Payment History') {
      window.location.href = 'fine_history.html'; // Redirect to balance.html
    }
    if (item.textContent === 'Register Terminal Operator') {
      window.location.href = 'add_tOperator.html'; // Redirect to balance.html
    }
    if (item.textContent === 'Detected Tricycles') {
      window.location.href = 'detected_tricycle.html'; // Redirect to balance.html
    }
    if (item.textContent === 'Terminal Exits') {
      window.location.href = 'terminal.html';
    }
  });
});

async function fetchVehicleOperators() {
  try {
    const response = await fetch(`${backendUrl}/get-vehicle-operators`);
    const data = await response.json();

    const tableBody = document.getElementById('vehicle-operators-list');
    tableBody.innerHTML = ''; // Clear previous data

    data.forEach(operator => {
      if (operator.balance < 0) {
        const row = document.createElement('tr');
        row.classList.add('body-number-row'); // Add class for event listener
        row.setAttribute('data-body-number', operator.body_number);
        row.setAttribute('data-balance', operator.balance);
        row.setAttribute('data-uid', operator.uid);

        const bodyNumberCell = document.createElement('td');
        bodyNumberCell.textContent = operator.body_number;

        
        const uidCell = document.createElement('td');
        uidCell.textContent = operator.uid;

        const offenseCell = document.createElement('td');
        offenseCell.textContent = 'Insufficient Balance';

        row.appendChild(bodyNumberCell);
       
        row.appendChild(uidCell);
        row.appendChild(offenseCell);

        tableBody.appendChild(row);
      }
    });

    // Add event listeners for each row
    document.querySelectorAll('.body-number-row').forEach(row => {
      row.addEventListener('click', () => {
        const bodyNumber = row.getAttribute('data-body-number');
        const balance = row.getAttribute('data-balance');
        const uid = row.getAttribute('data-uid');

        // Save the details to localStorage to share across pages
        localStorage.setItem('selectedOperator', JSON.stringify({ bodyNumber, balance, uid }));

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

document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.querySelector('.search-bar input');
  const vehicleTable = document.getElementById('vehicle-operators-list');

  // Create a suggestion box
  const suggestionBox = document.createElement('div');
  suggestionBox.className = 'suggestion-box';
  document.querySelector('.search-bar').appendChild(suggestionBox);

  // Handle input in search bar
  searchBar.addEventListener('input', () => {
    const query = searchBar.value.trim();
    if (query === '') {
      suggestionBox.innerHTML = '';
      suggestionBox.style.display = 'none';
      return;
    }

    const rows = vehicleTable.querySelectorAll('tr');
    const matches = Array.from(rows).filter(row =>
      row.cells[0]?.textContent.includes(query)
    );

    suggestionBox.innerHTML = matches
      .map(match => `<div class="suggestion">${match.cells[0].textContent}</div>`)
      .join('');
    suggestionBox.style.display = matches.length > 0 ? 'block' : 'none';

    // Add click event for suggestions
    suggestionBox.querySelectorAll('.suggestion').forEach(item => {
      item.addEventListener('click', () => {
        searchBar.value = item.textContent;
        suggestionBox.style.display = 'none';
        highlightRow(item.textContent);

        // Clear the search bar after selection
        searchBar.value = '';
      });
    });
  });

  // Handle Enter key in search bar
  searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchBar.value.trim();
      if (query !== '') highlightRow(query);
    }
  });

  // Highlight the row matching the body number
  function highlightRow(bodyNumber) {
    const rows = vehicleTable.querySelectorAll('tr');
    let found = false;

    rows.forEach(row => {
      row.classList.remove('highlight'); // Remove highlight from all rows

      const bodyNumberCell = row.cells[0]; // Check the first cell
      if (bodyNumberCell && bodyNumberCell.textContent.trim() === bodyNumber) {
        console.log("Match found! Highlighting row:", bodyNumber); // Debugging line
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('highlight');
        found = true;
      }
    });

    if (!found) {
      alert('Body number not found.');
      console.log("No match found for:", bodyNumber); // Debugging line
    }

    // Clear the search bar
    searchBar.value = '';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const tabIdKey = 'dashboard_tab_id';
  const userRole = localStorage.getItem('user_role');
const expectedRole = 'terminal'; 

if (!userRole || userRole !== expectedRole) {
  alert('Unauthorized access. Redirecting...');
  window.location.href = 'error.html';
}


  let tabId = sessionStorage.getItem(tabIdKey);
  if (!tabId) {
    tabId = Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(tabIdKey, tabId);
  }

  let ws = new WebSocket('ws://localhost:8081');

  function registerTab() {
    userRole = sessionStorage.getItem('user_role'); // re-fetch in case it changed
    if (!userRole) {
      console.error('Role still missing, closing WebSocket.');
      ws.close();
      return;
    }

    ws.send(JSON.stringify({
      type: 'register',
      tabId,
      role: userRole,
      expectedRole
    }));
  }

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
    registerTab();
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.error === 'unauthorized') {
      alert('Unauthorized access. Redirecting...');
      window.location.href = 'error.html';
    } else if (data.error) {
      alert(data.error);
      window.location.href = 'error.html';
    }
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected, attempting to reconnect...');
    setTimeout(() => {
      ws = new WebSocket('ws://localhost:8081');
      ws.onopen = registerTab;
    }, 1000);
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
      window.location.href = 'login.html'; // Redirect to login page
  };

  // Add event listener for "No" button
  document.getElementById('confirm-no').onclick = function () {
      notificationsBox.style.display = 'none'; // Close the notification
  };
}

// Fetch profile fullname
async function fetchProfile() {
  const token = localStorage.getItem('token'); // Get JWT token from localStorage

  if (!token) {
    alert('Unauthorized!');
    window.location.href = 'error.html'; // Redirect to user login page
    return;
  }

  try {
    const response = await fetch(`${backendUrl}/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      // Update the profile name dynamically
      document.querySelector('.profile-container p').textContent = data.fullname;
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

//change pass
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
      const response = await fetch(`${backendUrl}/api/change-password`, { // Updated endpoint
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
          showNotification(data.message, 'success'); // Show success message
          setTimeout(() => window.location.reload(), 3000); // Reload after 3s
      } else {
          showNotification(data.message || 'Failed to change password', 'error');
      }
  } catch (error) {
      console.error('Error changing password:', error);
      showNotification('Something went wrong. Please try again.', 'error');
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
