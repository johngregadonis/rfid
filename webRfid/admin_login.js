document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent form submission

    // Hardcoded username and password
    const validUsername = 'admin';
    const validPassword = 'admin69';

    // Get input values
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Check credentials
    if (username === validUsername && password === validPassword) {
        // Redirect to dashboard.html if credentials match
        window.location.href = 'dashboard.html';
    } else {
        // Show an alert if credentials are invalid
        alert('Invalid username or password. Please try again.');
    }
});
