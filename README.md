# Information Security Project - Password Breach Checker

This is a Flask-based web application developed for the Information Security (IS) Lab. The application checks user-submitted passwords against a locally defined list of common/breached passwords to evaluate their safety and mitigate potential security vulnerabilities.

## 🚀 Features
* **Password Verification:** Checks input passwords against a dictionary of highly vulnerable/breached passwords.
* **Flask Backend:** Lightweight Python backend utilizing Flask to handle API requests and template rendering.
* **Secure Setup:** Implements standard Python security libraries (`hashlib`, `secrets`, `string`).

## 🛠️ Tech Stack
* **Backend:** Python 3.14, Flask
* **Frontend:** HTML5, CSS3, JavaScript (Static)

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd "IS Project"
   ```

2. **Install dependencies:**
   Make sure you have Flask installed:
   ```bash
   pip install flask
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```
   Open your browser and navigate to `http://127.0.5.1:5000` or `http://localhost:5000`.

## 📁 Project Structure
```text
├── app.py              # Main Flask application logic
├── templates/
│   └── index.html      # Main frontend user interface
└── static/
    ├── style.css       # Custom UI styling
    └── script.js       # Frontend validation and interactivity
```

## 🔒 Security Disclaimer
This application is built strictly for **educational and demo purposes** as part of an academic IS Lab course. In a real-world production deployment, password security checks should be performed against comprehensive, live external database APIs (such as *Have I Been Pwned*) rather than a limited static list.
