let backendUrl = ''; // Global variable to store the backend URL

// Fetch the backend URL when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/get-backend-url');
        const data = await response.json();
        backendUrl = data.backendUrl;
        console.log("Backend URL Loaded:", backendUrl);

 
    } catch (error) {
        console.error('Error fetching backend URL:', error);
    }
});

  // Notification box setup
  document.getElementById('registrationForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission
  
    // Validate email
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('email-error');
    const emailValue = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!emailRegex.test(emailValue)) {
      emailError.style.display = 'block';
      emailError.textContent = 'Invalid email address.';
      return; // Stop submission if email is invalid
    } else {
      emailError.style.display = 'none';
    }
  
    // Validate phone number
    const phoneInput = document.getElementById('phone-number');
    const phoneError = document.getElementById('phone-error');
    const phoneValue = phoneInput.value.trim();
    const phoneRegex = /^[89]\d{9}$/; // Validates numbers starting with 8 or 9 and 10 digits long
  
    if (!phoneRegex.test(phoneValue)) {
      phoneError.style.display = 'block';
      phoneError.textContent = 'Invalid phone number. It should be 10 digits and start with 8 or 9.';
      return; // Stop submission if phone is invalid
    } else {
      phoneError.style.display = 'none';
    }
  
    // Combine country code with phone number
    const countryCode = document.getElementById('country-code').value;
    const fullPhoneNumber = `${countryCode}${phoneValue}`;
  
    // Prepare form data
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    data.number = fullPhoneNumber; // Save the full number with the country code
  
    try {
      const response = await fetch(`${backendUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
  
      const notificationBox = document.getElementById('notification-box');
      const notificationMessage = document.getElementById('notification-message');
  
      if (response.ok) {
        notificationMessage.textContent = 'Registration successful!';
        notificationMessage.style.color = '#F7971D';
  
        // Reset the form
        document.getElementById('registrationForm').reset();
      } else {
        notificationMessage.textContent = result.message || 'Registration failed!';
        notificationMessage.style.color = 'red';
      }
  
      notificationBox.style.display = 'flex'; // Show notification box
    } catch (error) {
      console.error('Error during registration:', error);
  
      const notificationBox = document.getElementById('notification-box');
      const notificationMessage = document.getElementById('notification-message');
  
      notificationMessage.textContent = 'An error occurred. Please try again.';
      notificationMessage.style.color = 'red';
      notificationBox.style.display = 'flex'; // Show notification box
    }
  });
  
  
  
  // Close notification box
  document.getElementById('close-notification').addEventListener('click', () => {
    document.getElementById('notification-box').style.display = 'none';
  });
  


  // Sidebar menu interaction
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      // Remove 'active' class from all items
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  
      // Add 'active' class to the clicked item
      item.classList.add('active');
  
      // Redirect to respective pages when menu items are clicked
      if (item.textContent === 'Reload Balance') {
        window.location.href = 'balance.html';
      }
      if (item.textContent === 'Registered Tricycles') {
        window.location.href = 'dashboard.html';
      }
      if (item.textContent === 'North Bound') {
        window.location.href = 'southb.html';
      }
      if (item.textContent === 'Offenders') {
        window.location.href = 'offenders.html';
      }
      if (item.textContent === 'Load Transaction') {
        window.location.href = 'load_history.html';
      }
      if (item.textContent === 'Penalty Transaction') {
        window.location.href = 'fine_history.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Register Vehicle') {
        window.location.href = 'add_vehicle.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Detected Tricycles') {
        window.location.href = 'detected_tricycle.html'; // Redirect to balance.html
      }
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    const tabIdKey = 'dashboard_tab_id';
    const userRole = localStorage.getItem('user_role');
  const expectedRole = 'admin'; // or 'terminal'
  
  if (!userRole || userRole !== expectedRole) {
    alert('Unauthorized access. Redirecting...');
    window.location.href = 'error.html';
  }
  
  
    let tabId = sessionStorage.getItem(tabIdKey);
    if (!tabId) {
      tabId = Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(tabIdKey, tabId);
    }
  
    let ws = new WebSocket('ws://localhost:8080');
  
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
        ws = new WebSocket('ws://localhost:8080');
        ws.onopen = registerTab;
      }, 1000);
    };
  
    window.addEventListener('beforeunload', () => {
      ws.close();
    });
  });