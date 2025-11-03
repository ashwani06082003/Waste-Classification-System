    document.addEventListener("DOMContentLoaded", () => {
        const pages = document.querySelectorAll(".page");
        
        // Validation functions
        const isValidMobileNumber = (number) => { 
            const mobileRegex = /^\d{10}$/;
            return mobileRegex.test(number);
        };

        const isStrongPassword = (password) => { 
            const strongPasswordRegex = /^.{8,}$/;
            return strongPasswordRegex.test(password);
        };

    function showPage(id = 'login-page') {
        pages.forEach(page => page.style.display = 'none');
        (document.getElementById(id) || document.getElementById('login-page')).style.display = 'block';
    }
    window.addEventListener("hashchange", () => showPage(location.hash.slice(1)));
    showPage(location.hash ? location.hash.slice(1) : 'login-page');

        // Login form
        document.querySelector("#login-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.querySelector("#username").value;
            const password = document.querySelector("#password").value;
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Loading...';
        
            try {
                const response = await fetch("http://localhost:3000/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",  // Ensure cookies (session) are sent
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();
                if (data.success) {
                    window.location.href = "http://localhost:3000/home";  // ✅ Redirects to backend
                } else {
                    alert(data.message || "Invalid Username or Password");
                }
            } catch (error) {
                console.error("Login failed:", error);
                alert("Server error during login.");
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Log In';
            }
        });
        
        //admin form
        document.querySelector("#admin-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.querySelector("#adminusername").value;
            const password = document.querySelector("#adminpassword").value;
            // Disable submit button and show loading state
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Loading...';
        
            try {
                const response = await fetch("http://localhost:3000/admin", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, password }),
                });
        
                if (response.ok) {
                    const result = await response.text();
                    alert(result);
                    // Redirect to admin page
                    window.location.href="admin.html";
                } else {
                    alert("Invalid Username or Password");
                }
            } catch (error) {
                console.error("Login failed:", error);
                showServerError();
            }
            finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit';
            }
        });    
        // Sign-up form
        document.querySelector("#sign-up-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.querySelector("#new-username").value;
            const password = document.querySelector("#newpassword").value;
            const confirmPassword = document.querySelector("#confirm-password").value;
            const mobile = document.querySelector("#mobile-number").value;
            const email = document.querySelector("#e-mail").value;
        
            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }
            // Validate mobile number
            if (!isValidMobileNumber(mobile)) {
                alert("Please enter a valid 10-digit mobile number.");
                return;
            }

            // Check password strength
            if (!isStrongPassword(password)) {
                alert("Password must be at least 8 characters long.");
                return;
            }

            // Disable submit button and show loading state
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Loading...';

            try {
                const response = await fetch("http://localhost:3000/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, password, mobile, email }),
                });
        
                if (response.ok) {
                    alert("Account created successfully! Please log in now...");
                    showPage("#login-page");
                } else {
                    const result = await response.text();
                    alert(result);
                }
            } catch (error) {
                console.error("Sign-up failed:", error);
                showServerError();
            }
            finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Sign Up';
            }
        });    

        // Forgot Password
        let generatedOTP; 

        document.querySelector("#send-otp").addEventListener("click", async () => {
            const email = document.querySelector("#registered-number").value.trim();
    
            if (!email) {
                alert("Please enter your registered email.");
                return;
            }
    
            try {
                let response = await fetch("http://localhost:3000/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });
    
                let data = await response.json();
                if (data.success) {
                    alert(`OTP sent to ${email}`);
                    generatedOTP = data.otp; // Store OTP to verify later
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error("Error sending OTP:", error);
            }
        });
    
        document.querySelector("#forgot-password-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const otp = document.querySelector("#otp").value.trim();
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Loading...';
    
            if (!generatedOTP) {
                alert("Please request an OTP first.");
                return;
            }
    
            if (otp === generatedOTP) {
                alert("OTP verified! Please reset your password.");
                showPage("reset-password-page"); // Redirect to password reset page
            } else {
                alert("Invalid OTP! Please try again.");
            }
        });
       // Reset Password Form
     document.querySelector("#reset-password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = document.querySelector("#new-password").value.trim();
    const confirmNewPassword = document.querySelector("#confirm-new-password").value.trim();
    const registeredNumber = document.querySelector("#registered-number").value;
    
    if (newPassword !== confirmNewPassword) {
        alert(`Password not match, new pass: ${newPassword} | confirm pass: ${confirmNewPassword}`);
        return;
    }

    if (!isStrongPassword(newPassword)) {
        alert("Password must be at least 8 characters long.");
        return;
    }

    // Disable submit button and show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Loading...';
    try {
        const response = await fetch("http://localhost:3000/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ registeredNumber, newPassword }),
        });
        if (response.ok) {
            alert("Password reset successfully! Please log in.");
            showPage("#login-page");
        } else {
            const result = await response.text();
            alert(result);
        }
    }
     catch (error) {
        console.error("Password reset failed:", error);
        showServerError();
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Reset Password';
    }
});
document.querySelector("#login-form").reset();
document.querySelector("#sign-up-form").reset();
document.querySelector("#reset-password-form").reset();

function showServerError() {
    const errorBox = document.createElement("div");
    errorBox.textContent = "Server is not responding. Please try again later.";
    errorBox.style.position = "fixed";
    errorBox.style.top = "20px";
    errorBox.style.left = "50%";
    errorBox.style.transform = "translateX(-50%)";
    errorBox.style.backgroundColor = "red";
    errorBox.style.color = "white";
    errorBox.style.padding = "10px";
    errorBox.style.borderRadius = "5px";
    errorBox.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.2)";
    errorBox.style.zIndex = "1000";

    document.body.appendChild(errorBox);

    // Remove the error box after 3 seconds
    setTimeout(() => {
        errorBox.remove();
    }, 3000);
}
    });

