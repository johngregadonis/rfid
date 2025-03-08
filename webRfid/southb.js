document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    // Remove 'active' class from all items
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));

    // Add 'active' class to the clicked item
    item.classList.add('active');

    // Redirect to different pages based on menu selection
    if (item.textContent === 'Reload Balance') {
      window.location.href = 'balance.html';
    }
    if (item.textContent === 'Registered Vehicles') {
      window.location.href = 'dashboard.html';
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
    if (item.textContent === 'Fine Payment History') {
      window.location.href = 'fine_history.html';
    }
    if (item.textContent === 'Register Terminal Operator') {
      window.location.href = 'add_tOperator.html';
    }
    if (item.textContent === 'Detected Tricycles') {
      window.location.href = 'detected_tricycle.html';
    }
  });
});

document.addEventListener('DOMContentLoaded', startDetectionCheck);

let detectedVehicles = JSON.parse(localStorage.getItem('detectedVehicles')) || [];

async function startDetectionCheck() {
updateDisplay(); // Show stored vehicles on load
setInterval(fetchDetectedVehicle, 1000); // Poll every 3 seconds
}

async function fetchDetectedVehicle() {
  try {
    const response = await fetch('http://localhost:2000/get-detected-vehicle');

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No recently detected vehicle found");
        detectedVehicles = []; // Clear detected vehicles
        localStorage.setItem('detectedVehicles', JSON.stringify(detectedVehicles));
        updateDisplay(); // Refresh UI to show nothing
        return;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched detected vehicle:", data);

    if (data && data.body_number) {
      // Prevent duplicates
      detectedVehicles = detectedVehicles.filter(v => v.body_number !== data.body_number);
      detectedVehicles.unshift(data);

      localStorage.setItem('detectedVehicles', JSON.stringify(detectedVehicles));
      updateDisplay();
    }
  } catch (error) {
    console.error('Error fetching detected vehicle:', error);
  }
}


function updateDisplay() {
let vehicleList = '';

detectedVehicles.forEach(operator => {
  const balance = parseFloat(operator.balance);
  let balanceClass = balance <= 10 ? 'red' : balance <= 30 ? 'yellow' : 'green';

  vehicleList += 
    `<tr class="body-number-row" 
         data-body-number="${operator.body_number}" 
         data-balance="${operator.balance}" 
         data-uid="${operator.uid}">
      <td>${operator.body_number}</td>
      <td>${operator.uid}</td>
      <td><span class="${balanceClass}"></span></td>

    </tr>`;
});

document.getElementById('vehicle-operators-list').innerHTML = vehicleList;

// Add event listeners for each row (Inserted function)
document.querySelectorAll('.body-number-row').forEach(row => {
  row.addEventListener('click', () => {
    const bodyNumber = row.getAttribute('data-body-number');
    const balance = row.getAttribute('data-balance');
    const uid = row.getAttribute('data-uid');

    // Save the details to localStorage or sessionStorage to share across pages
    localStorage.setItem('selectedOperator', JSON.stringify({ bodyNumber, balance, uid }));

    // Redirect to the sidebar page
    window.location.href = 'operator_details.html';
  });
});
}

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
  let tabId = sessionStorage.getItem(tabIdKey);

  // ✅ Generate a unique ID for this tab if it doesn't have one
  if (!tabId) {
      tabId = Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(tabIdKey, tabId);
  }

  let ws = new WebSocket('ws://localhost:8082');

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
          window.location.href = 'login.html'; // ❌ Redirect immediately
      }
  };

  ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      setTimeout(() => {
          ws = new WebSocket('ws://localhost:8082');
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
    alert('Unauthorized: Please log in again.');
    window.location.href = 'login.html'; // Redirect to user login page
    return;
  }

  try {
    const response = await fetch('http://localhost:2000/api/profile', {
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
      const response = await fetch('http://localhost:2000/api/change-password', { // Updated endpoint
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
