
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Prevent default form submission

  // Get input values
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
      const response = await fetch('http://localhost:4000/login', { // Change to user login endpoint
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
          // Store token in localStorage
          localStorage.setItem('token', data.token);

          // Redirect to add_vehicle.html
          window.location.href = 'terminal.html';
      } else {
          // Show error message
          alert(data.message || 'Invalid username or password');
      }
  } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again later.');
  }
});
