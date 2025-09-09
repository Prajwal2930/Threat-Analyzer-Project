# Threat Analyzer Project

## 📌 Overview

Threat Analyzer is a full-stack web application designed for cybersecurity incident response simulation and threat scanning. It combines:

- User authentication with JWT
- VirusTotal API integration (URL, file, domain/IP scanning)
- Interactive simulation scenarios including:
  - Phishing
  - Ransomware
  - Insider threats
  - Authentication attacks
- AI-powered debriefing to analyze user performance in simulations

---

## ⚙️ Backend Setup

### ✅ Requirements

- Node.js
- MongoDB
- Environment Variables:
  - `MONGO_URI` → MongoDB connection string
  - `JWT_SECRET` → Secret for JWT signing
  - `VIRUSTOTAL_API_KEY` → API key for VirusTotal

### 🚀 Installation & Running

```python
npm install
npm start
```

Server runs on the port specified in `.env` (default: 5000).

### 🔗 API Routes

| Method | Endpoint             | Description                         | Auth Required |
| ------ | -------------------- | ----------------------------------- | ------------- |
| POST   | `/api/auth/register` | Register a new user                 | ❌            |
| POST   | `/api/auth/login`    | User login, returns JWT token       | ❌            |
| POST   | `/api/scan/url`      | Scan a URL using VirusTotal         | ❌            |
| POST   | `/api/scan/file`     | Upload & scan a file via VirusTotal | ❌            |
| POST   | `/api/scan/search`   | Search IP/domain threat info        | ❌            |

---

## 🎨 Frontend Setup

### ✅ Requirements

- Node.js
- Vue.js with Vuetify
- Environment configured to point API calls to backend (e.g., `http://localhost:5000`)

### 🚀 Installation & Running

```python
npm install
npm run serve
```

### 🌟 Features

- User Authentication (Signup, Login)
- Dark/Light theme toggle
- Incident response simulator with multiple scenarios
- AI-powered debrief of user actions

### 🔗 Routes

| Path         | Description                  | Auth Required |
| ------------ | ---------------------------- | ------------- |
| `/`          | Home landing page            | ❌            |
| `/login`     | User login page/modal        | ❌            |
| `/signup`    | User registration page/modal | ❌            |
| `/simulator` | Incident response simulator  | ✅            |

---

## 🛠️ Usage Notes

- For protected routes, include header:  
  Authorization: Bearer <token>

- Test backend APIs with Postman or similar tools.
- Frontend maintains login state using localStorage token persistence.

---

## 📂 File Descriptions

### 🔹 Backend

- **app.js**  
  Main Express server setup  
  Middleware: CORS, JSON body parsing  
  MongoDB connection with Mongoose  
  Registers routes (`/api/auth`, `/api/scan`)  
  Starts server on configured port

- **authRoutes.js**  
  Endpoints for register and login  
  Uses bcryptjs for password hashing  
  Generates JWT token for session management  
  Input validation + error handling with try-catch

- **authMiddleware.js**  
  Middleware to verify JWT token  
  Extracts token from Authorization header  
  Attaches decoded user info to `req.user`  
  Returns 401 Unauthorized if token invalid/missing

- **User.js (Model)**  
  Mongoose schema for User collection  
  Fields: name, email (unique), password, createdAt  
  Validation for required fields & email uniqueness

### 🔹 Frontend

- **App.vue**  
  Root component controlling layout/navigation  
  Uses Vuetify UI components  
  Handles:
- Dark mode toggle
- Login state management
- Navigation to Simulator
- Conditional dialogs (SignIn/SignUp, confirmation)

- **Router Configuration**  
  Defines routes: Home, Login, Signup, Simulator  
  Simulator route protected by auth guard  
  Uses Vue Router history mode  
  Redirects unknown paths to Home

- **SignIn.vue**  
  Login form (email, password)  
  Validations for required fields + email format  
  Calls `/api/auth/login`  
  Stores JWT token in localStorage  
  Emits success events + navigates to Simulator

- **SignUp.vue**  
  Registration form (name, email, password)  
  Calls `/api/auth/register`  
  Shows success alert  
  Switches to SignIn on successful signup

- **Simulator.vue**  
  Controls simulator flow:
- SimulatorHome (choose scenario)
- SimulatorTerminal (run scenario)  
  Tracks scenarioType and scenarioChosen

- **SimulatorHome.vue**  
  UI for selecting simulation scenarios:  
  Phishing, Ransomware, Insider Threat, Authentication Attacks  
  Emits selected scenario to parent

- **SimulatorTerminal.vue**  
  Interactive terminal interface  
  Features:
- Color-coded logs (User, System, Alert)
- Scenario-specific prompts & branching paths
- Tracks user decisions (Good, Risky, Bad)
- AI-generated debrief of performance
- Exit confirmation & reset functionality

---

## 📜 License

MIT License

---

## 👨‍💻 Author

Prajwal Kunte
