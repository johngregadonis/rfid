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
    if (item.textContent === 'North Bound') {
      window.location.href = 'dashboard.html';
    }
    if (item.textContent === 'South Bound') {
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
    if (item.textContent === 'Detected Tricycle') {
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
  if (!data.name || !data.bodyNumber || !data.password || !data.balance|| !data.confirmPassword || !data.uid || !data.barangay || !data.address) {
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