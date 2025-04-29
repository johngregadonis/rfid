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