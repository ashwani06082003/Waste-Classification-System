//ADMINNN
  
document.querySelectorAll(".navList").forEach(function(element) {
    element.addEventListener('click', function() {
      
      document.querySelectorAll(".navList").forEach(function(e) {
        e.classList.remove('active');
    });

      // Add active class to the clicked navList element
      this.classList.add('active');
  
      // Get the index of the clicked navList element
      var index = Array.from(this.parentNode.children).indexOf(this);
  
      // Hide all data-table elements
      document.querySelectorAll(".data-table").forEach(function(table) {
        table.style.display = 'none';
      });
  
      // Show the corresponding table based on the clicked index
      var tables = document.querySelectorAll(".data-table");
      if (tables.length > index) {
        tables[index].style.display = 'block';
      }
    });
  });

      // Fetch the dashboard data from the backend endpoint
      function fetchDashboardData() {
        fetch('http://localhost:3000/dashboard-data')
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-users').textContent = data.totalUsers;
            document.getElementById('new-users').textContent = data.newUsers;
            document.getElementById('premium-users').textContent = data.premiumUsers; // 🔄 Update premium users count
        })
        .catch(error => console.error('Error fetching dashboard data:', error));
    }
     
      //profile updation
      function toggleProfilePopup() {
        let popup = document.getElementById("profilePopup");
        popup.style.display = (popup.style.display === "block") ? "none" : "block";
    }
    
    function toggleEdit() {
        document.getElementById("adminName").removeAttribute("readonly");
        document.getElementById("adminPassword").removeAttribute("readonly");
        document.getElementById("adminMobile").removeAttribute("readonly");
        
        document.getElementById("editBtn").style.display = "none";
        document.getElementById("saveBtn").style.display = "block";
    }
    
    function saveProfile() {
        let adminId = document.getElementById("adminId").value;
        let adminName = document.getElementById("adminName").value;
        let adminPassword = document.getElementById("adminPassword").value;
        let adminMobile = document.getElementById("adminMobile").value;
      
        // Call API to save profile details
        fetch('http://localhost:3000/update-admin', {
          method: 'PUT',  // Must be PUT to match app.put in server.js
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ID: adminId, 
            Name: adminName, 
            Password: adminPassword,
            Mobile: adminMobile
          })
        })
        .then(response => {
          if (!response.ok) {
            // If server returned an error status, throw it
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(data => {
          alert("Profile Updated!");
          document.getElementById("adminId").setAttribute("readonly", true);
          document.getElementById("adminName").setAttribute("readonly", true);
          document.getElementById("adminPassword").setAttribute("readonly", true);
          document.getElementById("adminMobile").setAttribute("readonly", true);
      
          document.getElementById("editBtn").style.display = "block";
          document.getElementById("saveBtn").style.display = "none";
        })
        .catch(error => {
          console.error("Error updating profile:", error);
          alert("Failed to update profile!");
        });
      }


// Fetch and display users when DOM is loaded
document.addEventListener("DOMContentLoaded", fetchUsers);

function fetchUsers() {
  fetch('http://localhost:3000/get-users')
    .then(response => response.json())
    .then(users => populateUserTable(users))
    .catch(error => console.error('Error fetching users:', error));
}

function populateUserTable(users) {
  let tableBody = document.getElementById("usersList");
  tableBody.innerHTML = ""; // Clear previous data

  users.forEach(user => {
    let row = document.createElement("tr");
    row.setAttribute("data-id", user.ID);

    row.innerHTML = `
      <td>${user.ID}</td>
      <td>
        <span class="display-field">${user.Username}</span>
        <input type="text" class="edit-field" value="${user.Username}" style="display:none;">
      </td>
      <td>
        <span class="display-field">${user.Email}</span>
        <input type="email" class="edit-field" value="${user.Email}" style="display:none;">
      </td>
      <td>
        <span class="display-field">${user.Mobile}</span>
        <input type="text" class="edit-field" value="${user.Mobile}" style="display:none;">
      </td>
      <td>
        <span class="display-field">${user.Premium}</span>
        <select class="edit-field" style="display:none;">
          <option value="yes" ${user.Premium.toLowerCase() === "yes" ? "selected" : ""}>Yes</option>
          <option value="no" ${user.Premium.toLowerCase() === "no" ? "selected" : ""}>No</option>
        </select>
      </td>
      <td>${user.signupDate || "N/A"}</td>
      <td>
        <button class="edit-btn" onclick="toggleEditRow(this)">Edit</button>
        <button onclick="deleteUser(${user.ID})" style="background: #cf5151e6;">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function searchUsers() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#usersList tr");

  rows.forEach(row => {
    const username = row.children[1].textContent.toLowerCase();
    const email = row.children[2].textContent.toLowerCase();
    const mobile = row.children[3].textContent.toLowerCase();

    if (
      username.includes(query) ||
      email.includes(query) ||
      mobile.includes(query)
    ) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}


function deleteUser(userId) {
  console.log("Delete function called with ID:", userId); // 👈 Debug log
  if (!confirm("Are you sure you want to delete this user?")) return;

  fetch(`http://localhost:3000/delete-user/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
  })
  .then(response => {
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
  })
  .then(data => {
      alert(data.message);
      document.querySelector(`tr[data-id='${userId}']`).remove();
  })
  .catch(error => console.error('Error deleting user:', error));
}



function toggleEditRow(btn) {
  let row = btn.closest("tr");
  // Determine if we're in edit mode (button text "Edit") or save mode ("Save")
  let isEditing = btn.textContent.trim() === "Edit";

  // For editable columns (assumed to be columns 1-4: Username, Email, Mobile, Premium)
  Array.from(row.children).forEach((cell, index) => {
    if (index >= 1 && index <= 4) {
      let displayField = cell.querySelector(".display-field");
      let editField = cell.querySelector(".edit-field");
      if (isEditing) {
        // Switch to edit mode: hide display, show input/select
        displayField.style.display = "none";
        editField.style.display = "block";
      } else {
        // Switch to view mode: update display with input value and hide input
        displayField.textContent = editField.value;
        displayField.style.display = "block";
        editField.style.display = "none";
      }
    }
  });

  if (isEditing) {
    btn.textContent = "Save";
  } else {
    // Prepare updated user data
    let userId = parseInt(row.getAttribute("data-id"));
    let updatedUser = {
      ID: userId,
      Username: row.children[1].querySelector("input").value,
      Email: row.children[2].querySelector("input").value,
      Mobile: row.children[3].querySelector("input").value,
      Premium: row.children[4].querySelector("select").value
    };

    // Send updated data to the server
    fetch('http://localhost:3000/update-user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    })
      .then(response => response.json())
      .then(data => {
        // alert(data.message);
        // Refresh the table with latest data after saving
        fetchUsers();
      })
      .catch(error => console.error('Error updating user:', error));

      saveUser(userId);
    btn.textContent = "Edit";
  }
}

function saveUser(userId) {
  let row = document.querySelector(`tr[data-id='${userId}']`);
  let updatedUser = {
      ID: userId,
      Username: row.children[1].querySelector("input").value,
      Email: row.children[2].querySelector("input").value,
      Mobile: row.children[3].querySelector("input").value,
      Premium: row.children[4].querySelector("select").value
  };

  fetch('http://localhost:3000/update-user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
  })
  .then(response => response.json())
  .then(data => {
      alert(data.message);
      fetchDashboardData();  // 🔄 Update the dashboard dynamically
  })
  .catch(error => console.error('Error updating user:', error));
}
// Fetch and display total waste count
function loadTotalWaste() {
  fetch('http://localhost:3000/dashboard/total-waste')
    .then(res => res.json())
    .then(data => {
      document.getElementById('total-waste').textContent = data.totalWaste;
    })
    .catch(err => {
      console.error('Error loading total waste:', err);
      document.getElementById('total-waste').textContent = 'N/A';
    });
}

function loadPredictionFeedback() {
  fetch('http://localhost:3000/dashboard/prediction-feedback')
    .then(res => res.json())
    .then(data => {
      document.getElementById('correct-predictions').textContent = data.correct;
      document.getElementById('incorrect-predictions').textContent = data.incorrect;
    })
    .catch(err => {
      console.error("Error fetching prediction feedback:", err);
    });
}

function loadFeedbackStats() {
  fetch('/feedback-stats')
    .then(response => response.json())
    .then(data => {
      document.getElementById('positive-feedback').innerText = data.positive;
      document.getElementById('negative-feedback').innerText = data.negative;
    })
    .catch(error => {
      console.error('Error loading feedback stats:', error);
    });
}

function loadWasteTypeChart() {
  fetch('/waste-type-distribution')
    .then(res => res.json())
    .then(data => {
      const labels = data.map(item => item.Category);
      const counts = data.map(item => item.Count);

      const ctx = document.getElementById('wasteChart').getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: 'Waste Type Distribution',
            data: counts,
            backgroundColor: [
              '#3498db', '#2ecc71', '#f1c40f',
              '#e67e22', '#e74c3c', '#9b59b6',
              '#1abc9c', '#34495e', '#95a5a6'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Waste Category Breakdown'
            }
          }
        }
      });
    })
    .catch(err => {
      console.error("Error loading waste type chart:", err);
    });
}
function loadUploadChart() {
  fetch('/uploads-over-time')
    .then(res => res.json())
    .then(data => {
      const ctx = document.getElementById('uploadChart').getContext('2d');
      const maxCount = Math.max(...data.counts);
      const yMax = maxCount + 8; //to increase the Y limit
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels.map(label => {
            const date = new Date(label);
            return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
          }),
          datasets: [{
            label: 'Uploads',
            data: data.counts,
            borderColor: '#3498db',
            backgroundColor: 'rgba(18, 109, 169, 0.61)', //to change bar color
            tension: 0.3,
            fill: true,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Uploads Over Time'
            }
          },

          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              max: yMax,             // 🟢 Increase to your expected max uploads per day
              ticks: {
                stepSize: 1        // Show labels at every step
              },
              title: {
                display: true,
                text: 'Number of Uploads'
              }
            }
          }
          
        }
      });
    })
    .catch(err => {
      console.error("Error loading upload chart:", err);
    });
}

function loadTopWasteCategoriesChart() {
  fetch('/top-waste-categories')
    .then(res => res.json())
    .then(data => {
      const ctx = document.getElementById('topCategoriesChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(row => row.Category),
          datasets: [{
            label: 'Total Uploads',
            data: data.map(row => row.Count),
            backgroundColor: '#9b59b6',
            borderRadius: 1,
            barThickness: 12 // Control the width of the bars
          }]
        },
        options: {
          indexAxis: 'y', // ✅ horizontal bar chart
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Top Waste Categories (All Time)'
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Uploads'
              },
            },
            y: {
              ticks: {
                beginAtZero: true
              }
            }
          }
        }
      });
    })
    .catch(err => {
      console.error("Error loading top waste categories chart:", err);
    });
}

function loadAvgConfidenceChart() {
  fetch('/average-confidence-over-time')
    .then(res => res.json())
    .then(data => {
      const ctx = document.getElementById('confidenceChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels.map(d => {
            const dt = new Date(d);
            return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
          }),
          datasets: [{
            label: 'Avg Confidence (%)',
            data: data.avgConfidence,
            borderColor: '#e67e22',
            backgroundColor: 'rgba(230, 126, 34, 0.2)',
            tension: 0.3,
            fill: true,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
            title: {
              display: true,
              text: 'Average Prediction Confidence (Last 7 Days)'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: { display: true, text: 'Confidence %' }
            }
          }
        }
      });
    })
    .catch(err => console.error("Error loading confidence chart:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  fetchDashboardData();  // existing stats
  fetchUsers();          // existing users load
  loadTotalWaste();      // new total-waste count
  loadPredictionFeedback();
  loadFeedbackStats(); 
  loadWasteTypeChart();
  loadUploadChart();
  loadTopWasteCategoriesChart(); 
  loadAvgConfidenceChart();
});

function deleteAllWaste() {
  if (!confirm("Are you sure? This will permanently delete all waste images except profile pictures.")) return;

  fetch('http://localhost:3000/delete-all-waste', { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadTotalWaste(); // 🔄 Refresh count if needed
    })
    .catch(err => {
      console.error('Error deleting waste images:', err);
      alert("Something went wrong. Please try again.");
    });
}
