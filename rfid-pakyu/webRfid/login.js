const form = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      // Store JWT token in localStorage
      localStorage.setItem('authToken', data.token);

      // Redirect to the dashboard page
      window.location.href = 'dashboard.html';
    } else {
      const errorData = await response.json();
      errorMessage.textContent = errorData.message;
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    console.error('Error during login:', error);
    errorMessage.textContent = 'An error occurred. Please try again.';
    errorMessage.style.display = 'block';
  }
});
