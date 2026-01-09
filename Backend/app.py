from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import random
import smtplib
from email.message import EmailMessage
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash
from dotenv import load_dotenv
import os


app = Flask(__name__)
CORS(app)

# ================= EMAIL CONFIG =================
load_dotenv()  # reads .env from same folder

SENDER_EMAIL = os.getenv("EMAIL_USER")
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")

# ================= DATABASE =====================
conn = psycopg2.connect(
    host="localhost", database="ease_db", user="postgres", password="pgadmin"
)


# ================= EMAIL FUNCTION ===============
def send_otp_email(to_email, otp):
    msg = EmailMessage()
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    msg["Subject"] = "EASE Email Verification"
    msg.set_content(f"Your OTP is: {otp}")

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(SENDER_EMAIL, SENDER_PASSWORD)
    server.send_message(msg)
    server.quit()


# ================= STEP 1: SEND OTP =============
@app.route("/register", methods=["POST"])
def register():
    try:
        email = request.json["email"]
        otp = str(random.randint(100000, 999999))

        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO users (email, otp, is_verified)
            VALUES (%s, %s, FALSE)
            ON CONFLICT (email)
            DO UPDATE SET otp = %s, is_verified = FALSE
            """,
            (email, otp, otp),
        )
        conn.commit()
        cur.close()

        send_otp_email(email, otp)
        print("OTP SENT:", otp)

        return jsonify({"message": "OTP sent"})

    except Exception as e:
        print("REGISTER ERROR:", e)
        return jsonify({"message": "Registration failed"}), 500


# ================= STEP 2: VERIFY OTP ===========
@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        email = request.json["email"]
        otp = request.json["otp"]

        cur = conn.cursor()
        cur.execute("SELECT otp FROM users WHERE email=%s", (email,))
        row = cur.fetchone()

        if row and row[0] == otp:
            cur.execute(
                "UPDATE users SET is_verified=TRUE, otp=NULL WHERE email=%s",
                (email,),
            )
            conn.commit()
            cur.close()
            return jsonify({"message": "OTP verified"})

        return jsonify({"message": "Invalid OTP"}), 400

    except Exception as e:
        print("VERIFY ERROR:", e)
        return jsonify({"message": "OTP verification failed"}), 500


# ================= STEP 3: COMPLETE PROFILE =====
@app.route("/complete-profile", methods=["POST"])
def complete_profile():
    try:
        data = request.json
        print("COMPLETE PROFILE DATA:", data)

        email = data["email"]
        username = data["username"]
        phone = data["phone"]
        pincode = data["pincode"]
        password = data["password"]

        password_hash = generate_password_hash(password)

        cur = conn.cursor()
        cur.execute(
            """
            UPDATE users
            SET username=%s,
                phone=%s,
                pincode=%s,
                password_hash=%s
            WHERE email=%s AND is_verified=TRUE
            """,
            (username, phone, pincode, password_hash, email),
        )

        if cur.rowcount == 0:
            return jsonify({"message": "Email not verified"}), 400

        conn.commit()
        cur.close()

        return jsonify({"message": "Registration completed"})

    except Exception as e:
        print("PROFILE ERROR:", e)
        return jsonify({"message": "Profile update failed"}), 500


@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data["email"]
        password = data["password"]

        cur = conn.cursor()
        cur.execute(
            """
            SELECT password_hash, is_verified
            FROM users
            WHERE email = %s
            """,
            (email,),
        )
        user = cur.fetchone()
        cur.close()

        if not user:
            return jsonify({"message": "User not registered"}), 400

        password_hash, is_verified = user

        if not is_verified:
            return jsonify({"message": "Please verify email first"}), 400

        if not check_password_hash(password_hash, password):
            return jsonify({"message": "Invalid credentials"}), 400

        return jsonify({"message": "Login successful"}), 200

    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"message": "Login failed"}), 500


# ================= RUN ==========================
if __name__ == "__main__":
    app.run(debug=True)
