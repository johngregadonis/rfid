fetch('/get-backend-url')
    .then(response => response.json())
    .then(data => {
        const backendUrl = data.backendUrl;
        console.log("Backend URL Loaded:", backendUrl);

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form submission

    // Get input values
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    localStorage.setItem('user_role', 'admin');

    try {
        const response = await fetch(`${backendUrl}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
       

        if (response.ok) {
            // Store token in localStorage (for authentication in future requests)
            localStorage.setItem('token', data.token);

            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Show error message
            alert(data.message || 'Invalid username or password');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again later.');
    }
});
    });