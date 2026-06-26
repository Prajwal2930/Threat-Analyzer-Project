# 🛡️ Threat Analyzer

A full-stack cybersecurity incident-response simulation and threat-scanning platform. Threat Analyzer lets users authenticate, scan URLs/files/domains via the VirusTotal API, and practice real-world incident response through interactive, AI-debriefed simulations.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Backend Setup](#️-backend-setup)
  - [Frontend Setup](#-frontend-setup)
- [API Routes](#-api-routes)
- [Frontend Routes](#-frontend-routes)
- [Usage Notes](#️-usage-notes)
- [File Descriptions](#-file-descriptions)
- [License](#-license)
- [Author](#-author)

---

## 📌 Overview

Threat Analyzer combines:

- 🔐 **User authentication** with JWT
- 🔍 **VirusTotal API integration** for scanning URLs, files, and domains/IPs
- 🧪 **Interactive simulation scenarios**, including:
  - Phishing
  - Ransomware
  - Insider threats
  - Authentication attacks
- 🤖 **AI-powered debriefing** that analyzes user performance after each simulation

---

## 🧰 Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, VirusTotal API
**Frontend:** Vue.js, Vuetify, Vue Router

---

## 📂 Project Structure

```
Apexia-IQ-Internship-project/
├── backend/
│   ├── app.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   └── models/
│       └── User.js
├── frontend/
│   └── src/
│       ├── App.vue
│       ├── router/
│       └── components/
│           ├── SignIn.vue
│           ├── SignUp.vue
│           ├── Simulator.vue
│           ├── SimulatorHome.vue
│           └── SimulatorTerminal.vue
└── package.json
```

---

## 🚀 Getting Started

Clone the repository first:

```bash
git clone https://github.com/Prajwal2930/Apexia-IQ-Internship-project.git
cd Apexia-IQ-Internship-project
```

### ⚙️ Backend Setup

**Requirements:**

- Node.js
- MongoDB

**Environment Variables** — create a `.env` file inside `backend/`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
VIRUSTOTAL_API_KEY=your_virustotal_api_key
PORT=5000
```

**Install & Run:**

```bash
cd backend
npm install
npm start
```

The server runs on the port specified in `.env` (default: `5000`).

---

### 🎨 Frontend Setup

**Requirements:**

- Node.js
- Vue.js with Vuetify

Make sure the frontend is configured to point API calls to your backend (e.g., `http://localhost:5000`).

**Install & Run:**

```bash
cd frontend
npm install
npm run serve
```

---

### ▶️ Run Both Together

From the project root:

```bash
npm install
npm run both
```

---

## 🔗 API Routes

| Method | Endpoint              | Description                          | Auth Required |
| ------ | ---------------------- | ------------------------------------- | :------------: |
| POST   | `/api/auth/register`   | Register a new user                   | ❌ |
| POST   | `/api/auth/login`      | User login, returns a JWT token        | ❌ |
| POST   | `/api/scan/url`         | Scan a URL using VirusTotal            | ❌ |
| POST   | `/api/scan/file`        | Upload & scan a file via VirusTotal    | ❌ |
| POST   | `/api/scan/search`      | Search IP/domain threat info           | ❌ |

---

## 🧭 Frontend Routes

| Path          | Description                    | Auth Required |
| ------------- | ------------------------------- | :------------: |
| `/`           | Home landing page                | ❌ |
| `/login`      | User login page/modal            | ❌ |
| `/signup`     | User registration page/modal     | ❌ |
| `/simulator`  | Incident response simulator      | ✅ |

---

## 🛠️ Usage Notes

- For protected routes, include the header:

  ```
  Authorization: Bearer <token>
  ```

- Test backend APIs with Postman or a similar tool.
- The frontend persists login state using a token stored in `localStorage`.

---

## 📂 File Descriptions

### 🔹 Backend

- **`app.js`**
  Main Express server setup — configures CORS and JSON body parsing, connects to MongoDB via Mongoose, registers the `/api/auth` and `/api/scan` routes, and starts the server on the configured port.

- **`authRoutes.js`**
  Handles registration and login endpoints. Uses `bcryptjs` for password hashing and issues a JWT on successful login. Includes input validation and error handling.

- **`authMiddleware.js`**
  Verifies the JWT from the `Authorization` header, attaches the decoded user to `req.user`, and returns `401 Unauthorized` if the token is missing or invalid.

- **`User.js` (Model)**
  Mongoose schema for the User collection — fields include `name`, `email` (unique), `password`, and `createdAt`, with validation for required fields and email uniqueness.

### 🔹 Frontend

- **`App.vue`**
  Root component controlling layout and navigation. Built with Vuetify, it manages dark mode toggling, login state, navigation to the Simulator, and conditional dialogs (Sign In/Sign Up, confirmations).

- **Router configuration**
  Defines the Home, Login, Signup, and Simulator routes. The Simulator route is protected by an auth guard, uses Vue Router history mode, and redirects unknown paths to Home.

- **`SignIn.vue`**
  Login form (email, password) with validation for required fields and email format. Calls `/api/auth/login`, stores the JWT in `localStorage`, and navigates to the Simulator on success.

- **`SignUp.vue`**
  Registration form (name, email, password) that calls `/api/auth/register`, shows a success alert, and switches to the Sign In view after a successful signup.

- **`Simulator.vue`**
  Orchestrates the simulator flow — toggling between `SimulatorHome` (scenario selection) and `SimulatorTerminal` (running the scenario) — and tracks the chosen scenario type.

- **`SimulatorHome.vue`**
  UI for selecting a simulation scenario (Phishing, Ransomware, Insider Threat, Authentication Attacks) and emits the chosen scenario to the parent component.

- **`SimulatorTerminal.vue`**
  Interactive terminal interface featuring color-coded logs (User, System, Alert), scenario-specific prompts with branching paths, tracking of user decisions (Good, Risky, Bad), an AI-generated performance debrief, and exit/reset functionality.

---

## 📜 License

Distributed under the **MIT License**.

---

## 👨‍💻 Author

**Prajwal Kunte**
