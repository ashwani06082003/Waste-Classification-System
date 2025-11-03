document.addEventListener("DOMContentLoaded", function() {
    // DOM references
    let videoElement = document.getElementById('video');
    let previewImg = document.getElementById('previewImg');
    let captureButton = document.getElementById('capture');
    let retakeButton = document.getElementById('retake');
    let uploadButton = document.getElementById('upload');

    // ===== Sidebar Toggle =====
    document.getElementById('moveButton').addEventListener('click', function () {
        const box = document.getElementById('box');
        const button = document.getElementById('moveButton');
        const currentLeft = parseInt(window.getComputedStyle(box).left, 10);

        if (currentLeft < 0) { // Hidden
            box.style.left = '0';
            button.textContent = '✖';
        } else { // Visible
            box.style.left = '-258px';
            button.textContent = '☰';
        }
    });

    // Close the sidebar when clicking outside
    document.addEventListener('click', function (event) {
        const box = document.getElementById('box');
        const button = document.getElementById('moveButton');
        if (!box.contains(event.target) && event.target !== button) {
            box.style.left = '-258px';
            button.textContent = '☰';
        }
    });

    // ===== Camera Modal =====
    function openCameraPopup() {
        document.getElementById('camera-modal').style.display = 'flex';
        startCamera();
    }
    // The button with id="openCameraButton" calls openCameraPopup()
    document.getElementById('openCameraButton').addEventListener('click', openCameraPopup);

    // Close camera modal
    document.getElementById('close-btn').addEventListener('click', function () {
        document.getElementById('camera-modal').style.display = 'none';
        stopCamera();
    });

    // logout when change password

    document.getElementById("cp").addEventListener("click", function(event) {
        event.preventDefault(); // Prevent default link behavior
        
        // Show confirmation box
        let confirmLogout = confirm("LOGING OUT!! \nAre you sure you want to change your password?");
        
        if (confirmLogout) {
            window.location.href = "../index.html#forgot-password-page"; // Redirect on confirmation
        }
    });

    // ===== Camera Functions =====
    function startCamera() {
        previewImg.src = '';  // Clear old image
    previewImg.style.display = 'none';  // Hide old image
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                videoElement.srcObject = stream;
            })
            .catch(function (err) {
                console.error('Error accessing the camera:', err);
            });
    }

    function stopCamera() {
        const stream = videoElement.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        videoElement.srcObject = null;
    }

    // Capture photo from camera feed
    captureButton.addEventListener('click', capturePhoto);
    function capturePhoto() {
        let canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        let ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        let imageUrl = canvas.toDataURL(); // Convert canvas to base64

        // Display captured image in preview
        previewImg.src = imageUrl;
        previewImg.style.display = 'block';

        // Hide video/capture button, show retake/upload
        videoElement.style.display = 'none';
        captureButton.style.display = 'none';
        retakeButton.style.display = 'inline';
        uploadButton.style.display = 'inline';
    }

    // Retake photo
    retakeButton.addEventListener('click', retakePhoto);
    function retakePhoto() {
        stopCamera();
        startCamera();
        previewImg.style.display = 'none';
        videoElement.style.display = 'block';
        captureButton.style.display = 'inline';
        retakeButton.style.display = 'none';
        uploadButton.style.display = 'none';
    }

    // ===== Convert Base64 to Blob (for camera captures) =====
    function base64ToBlob(base64, mime) {
        let byteString = atob(base64.split(',')[1]);
        let arrayBuffer = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
            arrayBuffer[i] = byteString.charCodeAt(i);
        }
        return new Blob([arrayBuffer], { type: mime });
    }

 // ===== Upload Photo from Camera =====
uploadButton.addEventListener('click', uploadPhoto);
function uploadPhoto() {
    let imageBase64 = previewImg.src;
    if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
        alert('Please capture a valid image before uploading!');
        return;
    }
    //closes camera
    document.getElementById('camera-modal').style.display = 'none';
    stopCamera();
    // Show loading spinner
    showLoadingSpinner();

    let mimeType = imageBase64.split(',')[0].split(':')[1].split(';')[0];
    let imageBlob = base64ToBlob(imageBase64, mimeType);

    let formData = new FormData();
    formData.append('image', imageBlob, 'captured_image.png');

    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
    })
    .then(response => response.ok ? response.json() : Promise.reject('Upload failed'))
    .then(data => {
        hideLoadingSpinner();
        if (data.success) {
            displayResultPopup(
                data.message,
                data.category,
                data.type,
                data.methods,
                data.disposal,
                data.environmental_impact,
                data.examples,
                data.file
            ); 
        } else {
            alert("Prediction error: " + data.message);
        }
    })
    .catch(error => {
        hideLoadingSpinner();
        console.error('Error uploading file:', error);
        alert('Failed to upload image. Please try again.');
    });
}

// ===== Upload from File Input (uploadphotoInput) =====
document.getElementById('uploadphotoInput').addEventListener('change', function (event) {
    let file = event.target.files[0];
    if (file) {
        // Display the image preview
        let reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
        };
        reader.readAsDataURL(file);


    // Show loading spinner
    showLoadingSpinner();

        // Prepare FormData
        let formData = new FormData();
        formData.append('image', file);
        
        fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        
        .then(response => {
            hideLoadingSpinner();
            if (!response.ok) {
                throw new Error('Failed to upload image');
            }
            return response.json();
        })
        .then(data => {
            hideLoadingSpinner();
            console.log('File upload success:', data);
            if (data.success) {
                displayResultPopup(
                    data.message,
                    data.category,
                    data.type,
                    data.methods,
                    data.disposal,
                    data.environmental_impact,
                    data.examples,
                    data.file
                );
            } else {
                alert("Prediction error: " + data.message);
            }
        })
        .catch(error => {
            hideLoadingSpinner();
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        });
    }
});

    // ===== Display Result Popup =====
    function displayResultPopup(message, category, type, methods, disposal, impact, examples, file) {
        let resultOverlay = document.createElement("div");
        resultOverlay.id = "resultOverlay";
        resultOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: 'Poppins', sans-serif;
        `;
    
        let resultBox = document.createElement("div");
        resultBox.style.cssText = `
            width: 90%;
            max-width: 600px;
            background: #fff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            position: relative;
            color: #333;
        `;
    
        let closeButton = document.createElement("span");
        closeButton.innerHTML = "&times;";
        closeButton.style.cssText = `
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            color: #888;
        `;
        closeButton.onclick = function () {
            document.body.removeChild(resultOverlay);
        };
    
        resultBox.innerHTML = `
            <h2 style="margin-top: 0; color: #28a745;">${message}</h2>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Recycling Methods:</strong> ${methods.join(", ")}</p>
            <p><strong>Disposal:</strong> ${disposal}</p>
            <p><strong>Environmental Impact:</strong> ${impact}</p>
            <p><strong>Examples:</strong> ${examples.join(", ")}</p>
            <div style="margin-top: 20px; text-align: center;">
                <img src="${file}" alt="Uploaded Image" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px;">
            </div>
            <div id="feedbackSection" style="margin-top: 25px; display: flex; justify-content: center; gap: 20px;">
                <button id="correctBtn" style="
                    padding: 10px 20px;
                    background-color: #28a745;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                ">Correct</button>
                <button id="incorrectBtn" style="
                    padding: 10px 20px;
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                ">Not Correct</button>
            </div>
        `;
    
        // Add close button
        resultBox.appendChild(closeButton);
        resultOverlay.appendChild(resultBox);
        document.body.appendChild(resultOverlay);
    
        // Handle Correct button
        resultBox.querySelector("#correctBtn").onclick = () => {
            fetch('http://localhost:3000/record-prediction-feedback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isCorrect: true })
            });
          
            resultBox.innerHTML = `
              <h2 style="color:rgb(113, 194, 101);">Thank you for your honest feedback</h2>
              <p>We appreciate your feedback. If you satisfied with the result then you can send us a feedback, the feedback option is given below</p>
              <button style="margin-top: 20px; padding: 10px 25px; background-color:rgba(120, 132, 125, 0.48); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"
                onclick="document.body.removeChild(document.getElementById('resultOverlay'))">
                Close
              </button>
            `;
          };
    
        // Handle Incorrect button
        resultBox.querySelector("#incorrectBtn").onclick = () => {
            fetch('http://localhost:3000/record-prediction-feedback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isCorrect: false })
            });
          
            resultBox.innerHTML = `
              <h2 style="color: #dc3545;">Sorry for the inconvenience</h2>
              <p>We appreciate your feedback. This helps us improve our system and provide better results in the future.</p>
              <button style="margin-top: 20px; padding: 10px 25px; background-color: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"
                onclick="document.body.removeChild(document.getElementById('resultOverlay'))">
                Close
              </button>
            `;
          };
    }
    
    
//result^^^^^^    


function showLoadingSpinner(duration = 15500) {
    let overlay = document.createElement("div");
    overlay.id = "loadingOverlay";
    overlay.style = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
    `;

    let spinner = document.createElement("div");
    spinner.style = `
        width: 60px;
        height: 60px;
        border: 6px solid #f3f3f3;
        border-top: 6px solid #00d1b2;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 15px;
    `;

    let percentage = document.createElement("div");
    percentage.id = "loadingPercent";
    percentage.style = `font-size: 18px;`;

    let styleTag = document.createElement("style");
    styleTag.innerHTML = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    document.head.appendChild(styleTag);
    overlay.appendChild(spinner);
    overlay.appendChild(percentage);
    document.body.appendChild(overlay);

    let start = Date.now();
    let updateInterval = 100;
    let end = start + duration;
    let interval = setInterval(() => {
        let now = Date.now();
        let elapsed = now - start;

        let progress = 0;
        if (elapsed <= 5000) {
            progress = (elapsed / 5000) * 30;
        } else if (elapsed <= 15000) {
            progress = 30 + ((elapsed - 5000) / 10000) * 50;
        } else {
            progress = 100;
        }

        percentage.textContent = `Loading... ${Math.floor(progress)}%`;

        if (elapsed >= duration) {
            percentage.textContent = "Loading... 100%";
            clearInterval(interval);
        }
    }, updateInterval);
}

function hideLoadingSpinner() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
        overlay.remove();
    }
}

const openModalBtn = document.getElementById('openUploadModal');
    const closeModalBtn = document.getElementById('closeUploadModal');
    const modal = document.getElementById('uploadModal');
    const overlay = document.getElementById('modalOverlay');

    // Show Modal
    openModalBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    });

    // Close Modal
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    });

    // Close modal when clicking outside
    overlay.addEventListener('click', () => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    });



    // ===== Slideshow (unchanged) =====
    let slideIndex = 0;
    showSlides();
    function showSlides() {
        let slides = document.getElementsByClassName("mySlides fade");
        for (let i = 0; i < slides.length; i++) {
            slides[i].classList.remove("active");
        }
        slideIndex++;
        if (slideIndex > slides.length) { slideIndex = 1; }
        slides[slideIndex - 1].classList.add("active");
        setTimeout(showSlides, 5000);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const profileLink = document.getElementById("profileLink");
    const profileModal = document.getElementById("profileModal");
    const closeProfileModal = document.getElementById("closeProfileModal");
    const updateProfileForm = document.getElementById("updateProfileForm");
  
    // 1) Show modal when user clicks "Profile"
    profileLink.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent link navigation
      // Optionally fetch existing user data to pre-fill form:
      // fetch("/getProfileData").then(...).then(...);
      profileModal.style.display = "block";
    });
  
    // 2) Close modal when clicking the X
    closeProfileModal.addEventListener("click", function () {
      profileModal.style.display = "none";
    });
  
    // Close modal if user clicks outside modal-content
    window.addEventListener("click", function (event) {
      if (event.target === profileModal) {
        profileModal.style.display = "none";
      }
    });
  
    // 3) Handle form submission (Save button)
    updateProfileForm.addEventListener("submit", function (event) {
      event.preventDefault();
  
      // Gather form data
      const newusername = document.getElementById("newUsername").value;
      const oldusername = document.getElementById("oldUsername").value;
      const password = document.getElementById("profilePassword").value;
      const mobile   = document.getElementById("profileMobile").value;
  
      // Send to server
      fetch("http://localhost:3000/updateProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ newusername, oldusername, password, mobile })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to update profile");
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          alert("Profile updated successfully!hs");
          // Optionally close modal
          profileModal.style.display = "none";
        } else {
          alert("Error: " + data.message);
        }
      })
      .catch(error => {
        console.error("Update error:", error);
        alert("An error occurred while updating profile.");
      });
    });
  });
  
  //THEME CODE FOR DARK AND LIGHT VVVVVVV
  document.addEventListener("DOMContentLoaded", function () {
    // Always apply the saved theme
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme === "light") {
        document.body.classList.add("light-mode");
    } else {
        document.body.classList.remove("light-mode");
    }

    // Check if the modal and button exist before using them
    const themeModal = document.getElementById("themeModal");
    const themeButton = document.getElementById("themeButton");
    const lightModeBtn = document.getElementById("lightMode");
    const darkModeBtn = document.getElementById("darkMode");

    if (themeButton && themeModal && lightModeBtn && darkModeBtn) {
        // Show the theme selection modal when "Theme" is clicked
        themeButton.addEventListener("click", function (event) {
            event.preventDefault();
            themeModal.style.display = "block";
        });

        // Switch to Light Mode
        lightModeBtn.addEventListener("click", function () {
            document.body.classList.add("light-mode");
            localStorage.setItem("theme", "light"); // Save theme
            themeModal.style.display = "none"; // Hide modal
        });

        // Switch to Dark Mode
        darkModeBtn.addEventListener("click", function () {
            document.body.classList.remove("light-mode");
            localStorage.setItem("theme", "dark"); // Save theme
            themeModal.style.display = "none"; // Hide modal
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    loadTopFeedbacks();

    // Delay slideshow
    setTimeout(() => {
        let testimonials = document.querySelectorAll(".testimonial-card");
        let index = 0;
        if (testimonials.length > 0) {
            function showNextTestimonial() {
                testimonials[index].classList.remove("active");
                index = (index + 1) % testimonials.length;
                testimonials[index].classList.add("active");
            }
            setInterval(showNextTestimonial, 3000);
        }
    }, 300);

    // Feedback Modals
    function openFeedbackForm() {
        document.getElementById("feedbackModal").style.display = "flex";
    }

    function closeFeedbackForm() {
        document.getElementById("feedbackModal").style.display = "none";
    }

    function closeAllFeedback() {
        document.getElementById("allFeedbackModal").style.display = "none";
    }

    function submitFeedback() {
        let name = document.getElementById("userName").value.trim();
        let email = document.getElementById("userEmail").value.trim();
        let feedback = document.getElementById("userFeedback").value.trim();

        if (!name || !email) return alert("Please enter your name and email.");
        if (feedback.length < 25) return alert("Feedback must be at least 25 characters.");

        fetch("http://localhost:3000/submit-feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, feedback })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Feedback submitted successfully!");
                closeFeedbackForm();
            } else {
                alert(data.message);
            }
        })
        .catch(err => console.error("Submit error:", err));
    }

    function loadTopFeedbacks() {
        fetch('/top-feedbacks')
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById('testimonial-container');
                container.innerHTML = '';
                data.forEach((user, index) => {
                    const card = document.createElement('div');
                    card.className = 'testimonial-card';
                    if (index === 0) card.classList.add('active');
                    const imageSrc = user.profileimg ? `/uploads/${user.profileimg}` : 'profile.png';
                    card.innerHTML = `
                        <img src="${imageSrc}" alt="${user.Username}">
                        <h3>${user.Username}</h3>
                        <p>"${user.Feedback}"</p>
                    `;
                    container.appendChild(card);
                });
            })
            .catch(err => console.error("Error loading top feedbacks:", err));
    }

    function loadAllFeedbacks() {
        fetch('/all-feedbacks')
            .then(res => res.json())
            .then(({ feedbacks, currentEmail }) => {
                const container = document.getElementById('feedbackList');
                container.innerHTML = '';

                feedbacks.forEach(user => {
                    const card = document.createElement('div');
                    card.className = 'testimonial-card';
                    const image = user.profileimg ? `/uploads/${user.profileimg}` : 'profile.png';
                    card.innerHTML = `
                        <img src="${image}" alt="${user.Username}">
                        <h3>${user.Username}</h3>
                        <p>"${user.Feedback}"</p>
                        ${user.Email === currentEmail
                            ? `<button onclick="editMyFeedback('${user.Username}', '${user.Email}', \`${user.Feedback}\`)">Edit</button>`
                            : ''}
                    `;
                    container.appendChild(card);
                });

                document.getElementById('allFeedbackModal').style.display = 'flex';
            })
            .catch(err => console.error("Error loading all feedbacks:", err));
    }

    function editMyFeedback(name, email, feedback) {
        document.getElementById('userName').value = name;
        document.getElementById('userEmail').value = email;
        document.getElementById('userFeedback').value = feedback;

        closeAllFeedback();
        openFeedbackForm();
    }

    function closeSuccessPopup() {
        document.getElementById("successPopup").style.display = "none";
    }

    // Global bindings
    window.openFeedbackForm = openFeedbackForm;
    window.closeFeedbackForm = closeFeedbackForm;
    window.closeAllFeedback = closeAllFeedback;
    window.submitFeedback = submitFeedback;
    window.loadAllFeedbacks = loadAllFeedbacks;
    window.editMyFeedback = editMyFeedback;

    // Close buttons for modals
    document.querySelectorAll(".close-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            closeFeedbackForm();
            closeAllFeedback();
        });
    });

    // Success Popup
    const successPopupBtn = document.querySelector(".success-popup button");
    if (successPopupBtn) successPopupBtn.addEventListener("click", closeSuccessPopup);
});
