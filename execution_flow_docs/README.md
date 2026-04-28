# 📚 Execution Flow Documentation
## Farmer Vendor Management System

> **Generated:** 2026-04-24  
> **Stack:** React.js (Vite) + Python Flask + MySQL

---

## 📁 Files in This Folder

| File | What It Explains |
|------|-----------------|
| [01_overall_flow.md](01_overall_flow.md) | Complete system architecture and data flow (Frontend → Backend → Database → UI) |
| [02_frontend_flow.md](02_frontend_flow.md) | React component lifecycle, button clicks, state updates, and re-renders |
| [03_backend_flow.md](03_backend_flow.md) | Flask request handling, route-to-function mapping, and business logic |
| [04_database_flow.md](04_database_flow.md) | MySQL schema, tables, foreign keys, triggers, views, and stored procedures |
| [05_api_flow.md](05_api_flow.md) | Complete REST API reference (all 35+ endpoints with request/response examples) |
| [06_feature_flows.md](06_feature_flows.md) | Step-by-step execution for Add Farmer, Dashboard, Smart Advice, Soil Analysis |
| [07_sequence_diagrams.md](07_sequence_diagrams.md) | Text-based sequence diagrams for all major system interactions |

---

## 🚀 Quick Start — Read in This Order

1. Start with **01_overall_flow.md** for the bird's-eye view
2. Read **04_database_flow.md** to understand the data model
3. Read **03_backend_flow.md** to understand the Flask API
4. Read **02_frontend_flow.md** to understand the React UI
5. Use **05_api_flow.md** as a reference when working with specific endpoints
6. Study **06_feature_flows.md** when implementing or debugging features
7. Consult **07_sequence_diagrams.md** to visualize interactions

---

## 🏗️ System Architecture (Quick Reference)

```
Browser (React) ──axios──> Flask API ──mysql.connector──> MySQL DB
     :5173 (dev)              :5000                    farmer_vendor_db
```

### 13 Database Tables
`farmer` → `land` → `expense`, `soil_report`  
`crop` → `harvest`, `activity`, `fertilizer_dosage`, `notification`  
`product` → `sales`  
`exporter` (standalone)  
`audit_log` (trigger-populated)

### 6 Active Triggers
1. `trg_validate_expense_amount` — rejects expenses ≤ 0
2. `trg_set_default_harvest_date` — auto-sets today's date
3. `trg_log_sale_insert` — auto-logs every sale to audit_log
4. `trg_prevent_negative_profit` — rejects negative profit
5. `trg_log_activity_insert` — auto-logs every chemical activity
6. `trg_set_default_activity_date` — auto-sets today's date

### 4 Stored Procedures
1. `sp_farmer_summary` — farmer + land + expense summary
2. `sp_monthly_sales_report` — sales grouped by month
3. `sp_revenue_by_product` — revenue per product
4. `sp_expense_by_land` — expenses per land parcel

### 3 Database Views
1. `farmer_summary_view` — farmer + land + expense JOIN
2. `sales_report_view` — sales + product JOIN with total_amount
3. `expense_report_view` — expense + land + farmer JOIN

### 16 Frontend Pages
LandingPage, Dashboard, Farmers, Land, Crops, Harvests,  
Activities, Products, Sales, Expenses, Reports,  
Fertilizers, Market, Notifications, SoilReports, AgriGuide

---

## 🔑 Key Code Paths

| Task | File | Function/Hook |
|------|------|---------------|
| App entry | `frontend/src/main.jsx` | `createRoot()` |
| Routing | `frontend/src/App.jsx` | `<Routes>` |
| API client | `frontend/src/api.js` | `axios.create()` |
| Flask startup | `backend/app.py` L1-51 | Pool creation |
| Get DB conn | `backend/app.py` L48 | `get_db()` |
| Generate IDs | `backend/app.py` L72 | `gen_id()` |
| Smart advice | `backend/app.py` L1370 | `farmer_smart_suggestions()` |
| ROI query | `backend/app.py` L1383 | SQL with roi_percentage calc |
| Soil tips | `frontend/src/pages/SoilReports.jsx` L55 | `getSuggestions()` |
| DB schema | `backend/setup_db.sql` | All tables + triggers |
