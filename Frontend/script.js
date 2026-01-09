document.addEventListener("DOMContentLoaded", () => {

    // Initialize icons
    lucide.createIcons();

    // Modal elements
    const modal = document.getElementById("authModal");
    const registerBtn = document.getElementById("registerBtn");
    const closeBtn = document.querySelector(".close");

    // Form
    const authForm = document.getElementById("authForm");

    // Inputs
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const otpInput = document.getElementById("otp");
    const phoneInput = document.getElementById("phone");
    const passwordInput = document.getElementById("password");
    const pincodeInput = document.getElementById("pincode");

    // Buttons
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    const verifyOtpBtn = document.getElementById("verifyOtpBtn");
    const registerSubmitBtn = document.getElementById("registerSubmitBtn");

    let otpVerified = false;

    /* ================= OPEN MODAL ================= */
    registerBtn.addEventListener("click", () => {
        modal.style.display = "block";
    });

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        authForm.reset();
        otpVerified = false;

        otpInput.disabled = true;
        verifyOtpBtn.disabled = true;
        registerSubmitBtn.disabled = true;
        sendOtpBtn.disabled = false;
    });

    /* ================= SEND OTP ================= */
    sendOtpBtn.addEventListener("click", () => {
        const email = emailInput.value.trim();

        if (!email) {
            alert("Please enter email first");
            return;
        }

        fetch("http://127.0.0.1:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                otpInput.disabled = false;
                verifyOtpBtn.disabled = false;
                sendOtpBtn.disabled = true;
            })
            .catch(err => {
                console.error(err);
                alert("Error sending OTP");
            });
    });

    /* ================= VERIFY OTP ================= */
    verifyOtpBtn.addEventListener("click", () => {
        const otp = otpInput.value.trim();
        const email = emailInput.value.trim();

        if (otp.length !== 6) {
            alert("Enter valid 6-digit OTP");
            return;
        }

        fetch("http://127.0.0.1:5000/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);

                if (data.message === "OTP verified") {
                    otpVerified = true;
                    registerSubmitBtn.disabled = false;
                    alert("OTP verified successfully. You can now register.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("OTP verification failed");
            });
    });

    /* ================= FINAL REGISTER ================= */
    authForm.addEventListener("submit", (e) => {
        e.preventDefault();

        if (!otpVerified) {
            alert("Please verify OTP first");
            return;
        }

        fetch("http://127.0.0.1:5000/complete-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: emailInput.value,
                username: usernameInput.value,
                phone: phoneInput.value,
                password: passwordInput.value,
                pincode: pincodeInput.value
            })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);

                if (data.message === "Registration completed") {
                    modal.style.display = "none";
                    authForm.reset();
                    otpVerified = false;
                }
            })
            .catch(err => {
                console.error(err);
                alert("Registration failed");
            });
    });

    /* ================= LOGIN LOGIC ================= */

    const loginBtn = document.getElementById("loginBtn");
    const loginModal = document.getElementById("loginModal");
    const closeLogin = document.getElementById("closeLogin");

    const loginForm = document.getElementById("loginForm");
    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");

    // Open login modal
    loginBtn.addEventListener("click", () => {
        loginModal.style.display = "flex";
    });

    // Close login modal
    closeLogin.addEventListener("click", () => {
        loginModal.style.display = "none";
        loginForm.reset();
    });

    // Submit login
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: loginEmail.value,
                password: loginPassword.value
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === "Login successful") {
                    alert("Login successful");
                    window.location.href = "dashboard.html";
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("Login failed");
            });
    });


});
