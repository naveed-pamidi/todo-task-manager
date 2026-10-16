# To-Do Task Manager

todo_app/
  backend/      Django + REST API + MySQL   (run on port 8000)
  frontend/     React (Vite)                (run on port 5173)
  frontend-js/  Plain HTML/CSS/JS           (open with VS Code "Go Live", port 5500)

Use EITHER frontend/ OR frontend-js/ - both talk to the same backend.

## Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
(create MySQL database: CREATE DATABASE todo_db CHARACTER SET utf8mb4;)
(put your MySQL password in config/settings.py)
python manage.py migrate
python manage.py runserver

## Frontend (React)
cd frontend
npm install
npm run dev          -> http://localhost:5173

## Frontend (plain JS)
Open frontend-js/index.html in VS Code and click "Go Live" (bottom right).

## API tests
cd backend
python manage.py test
