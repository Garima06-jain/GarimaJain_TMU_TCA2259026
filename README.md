# GarimaJain_TMU_TCA2259026

A full-stack **Task Management Web Application** built with Flask (Python) and a vanilla HTML/CSS/JS frontend. It allows teams to manage projects and tasks with role-based access control — admins can create and assign tasks, while members can view and update the ones assigned to them.

---

## 🚀 Features

- **User Authentication** — Signup and login using a custom User ID and password. Passwords are securely hashed using bcrypt, and sessions are managed via JWT tokens.
- **Role-Based Access** — Two roles are supported: `admin` and `member`. Admins have full control over tasks and projects; members can only see and update their own assigned tasks.
- **Task Management** — Admins can create, assign, and delete tasks with a due date and notes. Members can mark tasks as completed.
- **Project Management** — Create and list projects, accessible to all authenticated users.
- **Dashboard Stats** — Quickly view total, completed, and overdue tasks at a glance.
- **Frontend UI** — Clean multi-page interface with separate pages for login/signup, dashboard, and task management.

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Python, Flask, Flask-SQLAlchemy   |
| Auth       | JWT (PyJWT), Flask-Bcrypt         |
| Database   | SQLite                            |
| Frontend   | HTML, CSS, JavaScript (Vanilla)   |
| CORS       | Flask-CORS                        |
| Deployment | Procfile (Heroku-compatible)      |

---

## 📁 Project Structure
GarimaJain_TMU_TCA2259026/
│
├── app.py                  # App entry point — initializes Flask, DB, and blueprints
├── config.py               # Configuration (secret key, DB URI)
├── db.py                   # SQLAlchemy instance
├── requirements.txt        # Python dependencies
├── Procfile                # For deployment
│
├── models/
│   └── models.py           # User, Task, and Project database models
│
├── routes/
│   ├── auth_routes.py      # /auth/signup, /auth/login
│   ├── task_routes.py      # CRUD for tasks + dashboard stats
│   └── project_routes.py  # CRUD for projects
│
├── middleware/
│   └── auth_middleware.py  # JWT auth guard + admin-only guard
│
└── frontend/
    ├── index.html          # Login / Signup page
    ├── dashboard.html      # Dashboard with task stats
    ├── task.html           # Task listing and management
    ├── script.js           # Frontend logic (API calls, rendering)
    └── style.css           # Styling

---

## ⚙️ Setup & Installation

1. **Clone the repository**
```bash
   git clone https://github.com/Garima06-jain/GarimaJain_TMU_TCA2259026.git
   cd GarimaJain_TMU_TCA2259026
```

2. **Create a virtual environment and install dependencies**
```bash
   python -m venv venv
   source venv/bin/activate      
   pip install -r requirements.txt
```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

SECRET_KEY=your_secret_key_here
4. **Run the application**
```bash
   python app.py
```

   The server will start at `http://localhost:8000`

5. **Open the frontend**

   Open `frontend/index.html` in your browser, or serve it using a local server.

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint        | Description              | Access  |
|--------|----------------|--------------------------|---------|
| POST   | `/auth/signup`  | Register a new user      | Public  |
| POST   | `/auth/login`   | Login and receive JWT    | Public  |

### Tasks
| Method | Endpoint              | Description                    | Access       |
|--------|-----------------------|--------------------------------|--------------|
| POST   | `/tasks/`             | Create a new task              | Admin only   |
| GET    | `/tasks/`             | Get all/assigned tasks         | Authenticated|
| GET    | `/tasks/dashboard`    | Get task stats                 | Authenticated|
| PUT    | `/tasks/<id>`         | Update task status             | Authenticated|
| DELETE | `/tasks/<id>`         | Delete a task                  | Admin only   |

### Projects
| Method | Endpoint       | Description          | Access       |
|--------|----------------|----------------------|--------------|
| POST   | `/projects/`   | Create a project     | Authenticated|
| GET    | `/projects/`   | List all projects    | Authenticated|

---

## 👤 User Roles

- **Admin** — Can create, assign, and delete tasks; create projects; see all data.
- **Member** — Can view and update only their own assigned tasks and view projects.

---

## 📝 Notes

- The database is SQLite and gets created automatically on first run (`database.db`).
- JWT tokens expire after **2 hours**.
- Make sure to pass the token in the `Authorization: Bearer <token>` header for all protected routes.

---

*Developed by Garima Jain — TMU Assignment TCA2259026*