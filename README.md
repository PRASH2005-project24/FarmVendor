# 🌾 FarmVendor — Farmer Vendor Management System (FOR DESKTOP & MOBILE BOTH) 

A full-stack **Farmer Vendor Management System** built as a DBMS miniproject. Manage farming operations, land records, crops, products, sales, expenses, and harvests — all in one place.

(UPDATE! -- Suggestion system to the Farmers will be added soon.)

![Dashboard](https://img.shields.io/badge/Dashboard-8_Stats-green) ![CRUD](https://img.shields.io/badge/CRUD-7_Entities-blue) ![Languages](https://img.shields.io/badge/Languages-EN_|_HI_|_MR-orange)

---

## ✨ Features

- 📊 **Dashboard** — Overview with 8 stat cards (Farmers, Land, Crops, Products, Sales, Revenue, Expenses, Profit)
- 👨‍🌾 **Farmer Management** — Add, view, and delete farmer records
- 🗺️ **Land Records** — Track land/fields linked to farmers
- 🌱 **Crop Management** — Kharif/Rabi/Zaid season classification
- 📦 **Product Catalog** — Manage vegetables and products for sale
- 🛒 **Sales Tracking** — Record sales with revenue calculation
- 💸 **Expense Tracking** — Monitor farming costs (fertilizers, seeds, labor)
- 📦 **Harvest Records** — Track crop yields and profits
- 🌐 **Multi-language** — English, हिंदी (Hindi), मराठी (Marathi)
- 📱 **Mobile Friendly** — Responsive design with touch-friendly navigation

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) |
| Backend | Python (Flask) |
| Database | MySQL |
| Styling | Custom CSS (Glassmorphism, Dark Green Theme) |

---

## 📂 Project Structure

```
DBMS Miniproject/
├── backend/
│   ├── app.py                 # Flask REST API (14 endpoints)
│   ├── setup_db.sql           # MySQL schema + sample data
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # MySQL credentials (not committed)
├── frontend/
│   ├── src/
│   │   ├── components/        # Sidebar navigation
│   │   ├── context/           # Language context (i18n)
│   │   ├── pages/             # 8 page components
│   │   ├── translations.js    # EN/HI/MR translations
│   │   ├── api.js             # Axios HTTP client
│   │   ├── App.jsx            # Layout + routing
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Full design system
│   └── index.html
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **MySQL** (v8+)

### 1. Setup Database

```bash
cd backend
mysql -u root -p < setup_db.sql
```

### 2. Configure Environment

Create `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=farmer_vendor_db
```

### 3. Install & Run Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on `http://localhost:5000`

### 4. Install & Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Aggregate stats |
| GET/POST | `/api/farmers` | List / Add farmers |
| DELETE | `/api/farmers/<id>` | Delete farmer |
| GET/POST | `/api/land` | List / Add land records |
| DELETE | `/api/land/<id>` | Delete land record |
| GET/POST | `/api/crops` | List / Add crops |
| DELETE | `/api/crops/<id>` | Delete crop |
| GET/POST | `/api/products` | List / Add products |
| DELETE | `/api/products/<id>` | Delete product |
| GET/POST | `/api/sales` | List / Add sales |
| DELETE | `/api/sales/<id>` | Delete sale |
| GET/POST | `/api/expenses` | List / Add expenses |
| DELETE | `/api/expenses/<id>` | Delete expense |
| GET/POST | `/api/harvests` | List / Add harvests |

---

## 🗃️ Database Schema (3NF Normalized)

7 tables with foreign key relationships:

```
farmer (1:N) → land (1:N) → expense
crop (1:N) → harvest
product (1:N) → sales
```

---

## 📸 Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Mobile View
![Mobile](screenshots/mobile.png)

### Hindi Translation
![Hindi](screenshots/hindi.png)

---

## 👨‍💻 Author

**Prashik** — DBMS Miniproject 2026

---

## 📜 License

This project is for educational purposes as part of a DBMS course assignment.
