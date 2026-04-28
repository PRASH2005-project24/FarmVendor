# 01 — Overall System Execution Flow

## Project: Farmer Vendor Management System 🌾
**Stack:** React.js (Vite) + Python Flask + MySQL

---

## What Is This System?

This is a full-stack web application that helps farmers and vendors:
- Track farmers, land, crops, harvests, and expenses
- Record sales and products
- Analyze soil health and get smart crop recommendations
- View business reports (revenue, profit, monthly trends)

---

## The Big Picture

Every interaction in this system travels through **3 layers**:

```
[ User's Browser ]  →  [ React Frontend ]  →  [ Flask Backend ]  →  [ MySQL Database ]
                    ←                      ←                      ←
```

1. **User** clicks a button or loads a page
2. **React** handles the event and calls the Flask API via Axios
3. **Flask** receives the HTTP request, runs business logic, and queries the database
4. **MySQL** executes SQL and returns data rows
5. **Flask** serializes data to JSON and responds
6. **React** receives the JSON, updates component state
7. **React re-renders** the UI to display the new data

---

## Step-by-Step: Full System Flow

### Step 1 — Browser Loads the App

```
Browser visits http://localhost:5173  (dev)
         or   http://your-render-url  (production)
                   ↓
       index.html is served (Vite dev server / Flask static)
                   ↓
       main.jsx runs → ReactDOM.createRoot()
                   ↓
       BrowserRouter + LanguageProvider + App wrap the UI
                   ↓
       App.jsx checks current URL path (useLocation)
                   ↓
       If path === '/' → show <LandingPage />
       Otherwise → show <Sidebar> + matched <Route> component
```

### Step 2 — User Navigates to a Page (e.g., Farmers)

```
User clicks "Farmers" in the sidebar
                   ↓
React Router changes URL to /farmers
                   ↓
<Farmers /> component mounts
                   ↓
useEffect() fires on mount → calls fetchFarmers()
                   ↓
fetchFarmers() calls:
  API.get('/farmers?sort_by=created_at&order=desc')
```

`API` is an Axios instance defined in `frontend/src/api.js`:
```js
// In development: baseURL = 'http://localhost:5000/api'
// In production:  baseURL = '/api'
```

### Step 3 — HTTP Request Travels to Flask

```
Axios sends:
  GET http://localhost:5000/api/farmers?sort_by=created_at&order=desc

Flask receives this on:
  @app.route('/api/farmers', methods=['GET', 'POST'])
  def handle_farmers():
```

Flask is running at `localhost:5000` (started via `python backend/app.py`).  
CORS is enabled for `localhost:5173` (React dev server).

### Step 4 — Flask Processes the Request

```
handle_farmers() runs:
   ↓
1. conn = get_db()       ← Gets a connection from the MySQL connection pool
   ↓
2. cursor = conn.cursor(dictionary=True)   ← Returns rows as dicts
   ↓
3. Builds SQL query:
   SELECT * FROM farmer ORDER BY created_at DESC
   ↓
4. cursor.execute(query, params)
   ↓
5. rows = cursor.fetchall()     ← Fetches all result rows
   ↓
6. Converts timestamps to strings (for JSON serialization)
   ↓
7. cursor.close(); conn.close()  ← Returns connection to pool
   ↓
8. return jsonify(rows), 200
```

### Step 5 — MySQL Executes the Query

```
MySQL engine receives:
  SELECT * FROM farmer ORDER BY created_at DESC
         ↓
Scans the 'farmer' table in 'farmer_vendor_db' database
         ↓
Returns rows: [
  { farmer_id: "F2", name: "Mr. Ramesh Jadhav", location: "Nashik", ... },
  { farmer_id: "F1", name: "Mrs. Sunita Patil", location: "Pune", ... }
]
```

### Step 6 — Flask Returns JSON Response

```
Flask serializes the list to JSON:
  [
    {"farmer_id": "F2", "name": "Mr. Ramesh Jadhav", ...},
    {"farmer_id": "F1", "name": "Mrs. Sunita Patil", ...}
  ]

HTTP Response:
  Status: 200 OK
  Content-Type: application/json
  Body: [ ... ]
```

### Step 7 — React Updates State and Re-renders UI

```
Axios receives the 200 response
         ↓
.then(res => setFarmers(res.data))
         ↓
React state `farmers` is updated with the array
         ↓
React re-renders <Farmers /> component
         ↓
The farmer table is populated with the new data
         ↓
User sees the updated farmer list on screen ✅
```

---

## Error Handling Flow

```
Any step fails (network error, DB down, SQL error)?
         ↓
Flask returns:  { "error": "error description" }  with status 500
         ↓
Axios .catch() block runs
         ↓
console.error(err) or alert('Error: ...')
         ↓
User sees an error message
```

---

## Data Flow Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│   Clicks Button → Form Submit → Page Load → Filter/Sort         │
└──────────────────────────┬──────────────────────────────────────┘
                           │  User Event
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                              │
│   main.jsx → App.jsx → Sidebar → [Page Component]              │
│   useEffect() / onClick() → API.get/post/put/delete()          │
│   setFarmers(res.data) → Component re-renders                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP Request (Axios)
                           │  GET/POST/PUT/DELETE /api/...
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FLASK BACKEND (app.py)                        │
│   @app.route('/api/...') → handler function                     │
│   get_db() → cursor → SQL query → fetchall() → jsonify()       │
│   Business logic: gen_id(), SOIL_CROP_MAP, ROI calc            │
└──────────────────────────┬──────────────────────────────────────┘
                           │  SQL Query via mysql.connector
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MYSQL DATABASE                                │
│   Database: farmer_vendor_db                                    │
│   Tables: farmer, land, crop, product, sales, expense,          │
│           harvest, activity, fertilizer_dosage, soil_report,   │
│           exporter, notification, audit_log                     │
│   Views: farmer_summary_view, sales_report_view, expense_report_view │
│   Triggers: 6 triggers (validate, log, default values)         │
│   Stored Procedures: 4 procedures with cursors                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Roles

| Layer      | Technology          | Role                                      |
|------------|---------------------|-------------------------------------------|
| Frontend   | React.js (Vite)     | UI, routing, state management, API calls  |
| HTTP Client| Axios               | Makes HTTP requests to Flask              |
| Backend    | Python Flask        | REST API, business logic, DB access       |
| Database   | MySQL               | Persistent data storage, triggers, views  |
| ORM/Driver | mysql.connector     | Connects Flask to MySQL                   |
| CORS       | flask_cors          | Allows cross-origin requests from React   |
| Env Vars   | python-dotenv       | Loads DB credentials from .env file       |

---

## Development vs Production

| Aspect         | Development                             | Production (Render)                   |
|----------------|-----------------------------------------|---------------------------------------|
| React URL      | `http://localhost:5173`                 | Same URL as Flask                     |
| Flask URL      | `http://localhost:5000`                 | Deployed on Render                    |
| API Base URL   | `http://localhost:5000/api`             | `/api` (same origin)                  |
| Static files   | Served by Vite dev server               | Served by Flask from `frontend/dist/` |
| DB Host        | `localhost`                             | Remote MySQL (via env vars)           |
