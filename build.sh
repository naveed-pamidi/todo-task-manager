#!/usr/bin/env bash
set -e

python -m pip install -r backend/requirements.txt
npm ci --prefix frontend
VITE_BASE_PATH=/static/ npm run build --prefix frontend

cd backend
python manage.py collectstatic --noinput
