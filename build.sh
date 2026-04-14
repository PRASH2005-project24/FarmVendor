#!/usr/bin/env bash
# Render build script — builds both frontend and backend

set -o errexit

# Install Python dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..
