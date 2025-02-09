
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
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
  
      const notificationBox = document.getElementById('notification-box');
      const notificationMessage = document.getElementById('notification-message');
  
      if (response.ok) {
        notificationMessage.textContent = 'Registration successful!';
        notificationMessage.style.color = 'green';
  
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
      if (item.textContent === 'Registered Vehicles') {
        window.location.href = 'dashboard.html';
      }
      if (item.textContent === 'North Bound') {
        window.location.href = 'southb.html';
      }
      if (item.textContent === 'Offenders') {
        window.location.href = 'offenders.html';
      }
      if (item.textContent === 'Load History') {
        window.location.href = 'load_history.html';
      }
      if (item.textContent === 'Fine Payment History') {
        window.location.href = 'fine_history.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Register Vehicle') {
        window.location.href = 'add_vehicle.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Detected Tricycle') {
        window.location.href = 'detected_tricycle.html'; // Redirect to balance.html
      }
    });
  });