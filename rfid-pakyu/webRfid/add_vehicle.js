document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      // Remove 'active' class from all items
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  
      // Add 'active' class to the clicked item
      item.classList.add('active');
  
      // Redirect to 'balance.html' if 'Reload Balance' is clicked
      if (item.textContent === 'Reload Balance') {
        window.location.href = 'balance.html'; // Redirect to balance.html
      }
      if (item.textContent === 'North Bound') {
        window.location.href = 'dashboard.html'; // Redirect to balance.html
      }
      if (item.textContent === 'South Bound') {
        window.location.href = 'southb.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Offenders') {
        window.location.href = 'offenders.html'; // Redirect to balance.html
      }
      if (item.textContent === 'Load History') {
        window.location.href = 'load_history.html'; // Redirect to balance.html
      }
    });
  });
  document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission
  
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
  
    // Check if required fields are empty
    if (!data.name || !data.contact || !data.bodyNumber || !data.password || !data.confirmPassword || !data.uid || !data.balance) {
      alert('Please fill in all required fields.');
      return;
    }
  
    const notificationBox = document.getElementById('notification-box');
    const notificationMessage = document.getElementById('notification-message');
  
    try {
      const response = await fetch(event.target.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
  
      if (result.success) {
        notificationMessage.textContent = result.message;
        notificationMessage.style.color = 'green';
      } else {
        notificationMessage.textContent = result.message;
        notificationMessage.style.color = 'red';
      }
      notificationBox.style.display = 'flex';
    } catch (error) {
      notificationMessage.textContent = 'An error occurred. Please try again.';
      notificationMessage.style.color = 'red';
      notificationBox.style.display = 'flex';
    }
  });
  
  
  // Close notification box
  document.getElementById('close-notification').addEventListener('click', () => {
    document.getElementById('notification-box').style.display = 'none';

// Reset the form fields
document.querySelector('form').reset();

  });
  
