// City and Barangay dropdown
const barangays = {
  BoronganCity: ["Alang-alang", "Balud", "Bato", "Cabong", "Campesao", "Hindang", "Lalawigan", "Libuton", "Maypangdan",
                  "Purok A (Pob.)", "Purok B (Pob.)", "Purok C (Pob.)", "Purok D1 (Pob.)", "Purok D2 (Pob.)", "Purok E (Pob.)",
                  "Purok F (Pob.)", "Purok G (Pob.)", "Purok H (Pob.)", "Punta Maria", "Sabang North", "Sabang South", 
                  "Sanata Fe", "Songco", "Taboc", "Tabunan", "Tamoso",
  ],
  Maydolong: ["Poblacion 1", "Poblacion 2", "Poblacion 3", "Poblacion 4", "Poblacion 5", "Poblacion 6", "Poblacion 7",
              "Maybocog", "Omawas", "Camada"


  ],
  SanJulian: ["Casoroy", "Libas", "Barangay 1 (Pob.)", "Barangay 2 (Pob.)", "Barangay 3 (Pob.)", "Barangay 4 (Pob.)",
              "Barangay 5 (Pob.)", "Barangay 6 (Pob.)", "San Miguel"
  ]
};

const citySelect = document.getElementById('city');
const barangaySelect = document.getElementById('barangay');

citySelect.addEventListener('change', function() {
  const selectedCity = citySelect.value;
  const barangayOptions = barangays[selectedCity] || [];

  barangaySelect.innerHTML = '<option value="">Select a barangay...</option>'; // Clear previous options

  barangayOptions.forEach(function(barangay) {
    const option = document.createElement('option');
    option.value = barangay;
    option.textContent = barangay;
    barangaySelect.appendChild(option);
  });
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
    if (item.textContent === 'Register Terminal Operator') {
      window.location.href = 'add_tOperator.html'; // Redirect to balance.html
    }
    if (item.textContent === 'Detected Tricycles') {
      window.location.href = 'detected_tricycle.html'; // Redirect to balance.html
    }
  });
});

// Form submission logic
document.querySelector('form').addEventListener('submit', async (event) => {
  event.preventDefault(); // Prevent default form submission

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

  // Check if required fields are empty
  if (!data.name || !data.bodyNumber || !data.password || !data.balance|| !data.confirmPassword || !data.uid || !data.barangay || !data.address || !data.email || !data.contact) {
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

// Close notification box and reset form
document.getElementById('close-notification').addEventListener('click', () => {
  document.getElementById('notification-box').style.display = 'none';
  document.querySelector('form').reset();
});

document.getElementById('vehicleForm').addEventListener('submit', function(event) {
  let isValid = true;

  // Validate Email
  const email = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email.value)) {
    emailError.style.display = 'block';
    emailError.textContent = 'Invalid email address.';
    isValid = false;
  } else {
    emailError.style.display = 'none';
  }

  // Validate Phone Number
  const phoneNumber = document.getElementById('phone-number');
  const phoneError = document.getElementById('phone-error');
  const phonePattern = /^9\d{9}$/; // Must start with 9 and be exactly 10 digits

  if (!phonePattern.test(phoneNumber.value)) {
    phoneError.style.display = 'block';
    phoneError.textContent = 'Phone number must start with 9 and be exactly 10 digits.';
    isValid = false;
  } else {
    phoneError.style.display = 'none';
  }

  // Validate Body Number
  const bodyNumber = document.getElementById('bodyNumber');
  const bodyNumberError = bodyNumber.nextElementSibling;
  if (!/^\d{3,4}$/.test(bodyNumber.value)) {
    bodyNumberError.textContent = 'Body Number must be 3 or 4 digits.';
    isValid = false;
  } else {
    bodyNumberError.textContent = '';
  }

  // Validate UID
  const uid = document.getElementById('uid');
  const uidError = uid.nextElementSibling;
  if (!/^\w{4}$/.test(uid.value)) {
    uidError.textContent = 'UID must be exactly 4 characters.';
    isValid = false;
  } else {
    uidError.textContent = '';
  }

  // Validate Balance
  const balance = document.getElementById('balance');
  const balanceError = balance.nextElementSibling;
  if (!/^\d+(\.\d{1,2})?$/.test(balance.value)) {
    balanceError.textContent = 'Balance must be a numeric value.';
    isValid = false;
  } else {
    balanceError.textContent = '';
  }

  // Prevent form submission if any validation fails
  if (!isValid) {
    event.preventDefault();
    
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

  let ws = new WebSocket('ws://localhost:8081');

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
          ws = new WebSocket('ws://localhost:8081');
          ws.onopen = registerTab;
      }, 1000); // ✅ Reconnect after 1 second
  };

  window.addEventListener('beforeunload', () => {
      ws.close();
  });
});
