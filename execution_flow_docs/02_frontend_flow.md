# 02 — Frontend Execution Flow

## React.js (Vite) — How the Frontend Works

---

## Application Entry Point

**File:** `frontend/src/main.jsx`

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>          {/* Enables client-side routing */}
      <LanguageProvider>     {/* Global language/translation context */}
        <App />              {/* Root component */}
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
)
```

**Execution Order:**
1. `index.html` loads → injects `<div id="root">`
2. Vite bundles and serves `main.jsx`
3. `createRoot()` mounts React into the `#root` div
4. `BrowserRouter` watches the browser URL
5. `LanguageProvider` sets up translation context (English/Marathi)
6. `App` component renders

---

## App Component — Routing Logic

**File:** `frontend/src/App.jsx`

```jsx
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();   // reads current URL path

  if (location.pathname === '/') {
    return <LandingPage />;         // Full-screen landing, no sidebar
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} ... />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/farmers"     element={<Farmers />} />
          <Route path="/land"        element={<Land />} />
          <Route path="/crops"       element={<Crops />} />
          <Route path="/harvests"    element={<Harvests />} />
          <Route path="/activities"  element={<Activities />} />
          <Route path="/products"    element={<Products />} />
          <Route path="/sales"       element={<Sales />} />
          <Route path="/expenses"    element={<Expenses />} />
          <Route path="/reports"     element={<Reports />} />
          <Route path="/fertilizers" element={<Fertilizers />} />
          <Route path="/market"      element={<Market />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/soil-reports" element={<SoilReports />} />
          <Route path="/agri-guide"  element={<AgriGuide />} />
        </Routes>
      </main>
      <Toast />   {/* Global toast notification system */}
    </div>
  );
}
```

**Logic:**
- If URL = `/` → Landing page (marketing screen, no sidebar)
- Otherwise → Main app layout (sidebar + routed page content)

---

## Axios API Client

**File:** `frontend/src/api.js`

```js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:5000/api' : '/api',
});

export default API;
```

- In **development**: all API calls go to `http://localhost:5000/api`
- In **production**: all API calls go to `/api` (same origin as Flask)
- Every page imports `API` and calls `API.get(...)`, `API.post(...)`, etc.

---

## What Happens When a User Clicks a Button

We'll use **"Add Farmer"** as the detailed example.

### 1. User Fills the Form

**File:** `frontend/src/pages/Farmers.jsx`

```jsx
const [form, setForm] = useState({ name: '', location: '' });

<input
  value={form.name}
  onChange={e => setForm({ ...form, name: e.target.value })}
/>
```

- Each keystroke calls `setForm()` which updates React state
- React re-renders the input element with the new value (controlled component)

### 2. User Clicks "Add Farmer" Button

```jsx
<form onSubmit={handleSubmit}>
  ...
  <button type="submit">Add Farmer</button>
</form>
```

- The `submit` event is fired
- `handleSubmit(e)` is called

### 3. handleSubmit() Runs

```jsx
const handleSubmit = (e) => {
  e.preventDefault();           // Stops default form POST (page reload)
  if (!form.name.trim()) return; // Validate: name must not be empty
  
  API.post('/farmers', form)    // Send POST request to Flask
    .then(() => {
      setForm({ name: '', location: '' }); // Clear the form
      fetchFarmers();                      // Reload the farmer list
    })
    .catch(err => alert('Error: ' + err.message)); // Handle errors
};
```

### 4. Axios Sends HTTP Request

```
POST http://localhost:5000/api/farmers
Content-Type: application/json
Body: { "name": "Raju Shelar", "location": "Solapur" }
```

### 5. Flask Processes and Responds

(See `03_backend_flow.md` for Flask details)

Flask returns: `{ "id": "F3", "message": "Farmer added" }` with status `201`

### 6. React Updates State and UI

```jsx
.then(() => {
  setForm({ name: '', location: '' });  // Form clears
  fetchFarmers();                        // Fresh data fetched
})
```

`fetchFarmers()` fires a new `GET /api/farmers` request → gets updated list → `setFarmers(res.data)` → React re-renders the table with the new farmer.

---

## The Full React Data Fetch Pattern (Used Everywhere)

Every page follows this exact pattern:

```jsx
// 1. STATE: holds the data to display
const [farmers, setFarmers] = useState([]);
const [loading, setLoading] = useState(true);

// 2. FETCH FUNCTION: calls the API
const fetchFarmers = () => {
  API.get('/farmers')
    .then(res => setFarmers(res.data))   // Update state with response
    .catch(err => console.error(err))    // Log any error
    .finally(() => setLoading(false));   // Always stop loading spinner
};

// 3. EFFECT: runs fetch on mount (and when deps change)
useEffect(() => {
  fetchFarmers();
}, [sortBy, order, filterLoc]);  // Re-fetch when filters change

// 4. RENDER: shows loading, empty, or data states
if (loading) return <div className="spinner" />;
if (farmers.length === 0) return <div>No farmers yet</div>;
return <table>...</table>;  // Render data
```

---

## State Update → UI Re-render Flow

```
setFarmers([...new data...])
         ↓
React detects state change
         ↓
Component function re-executes
         ↓
Virtual DOM diff computed (only changed elements updated)
         ↓
Real DOM updated
         ↓
User sees new data on screen ✅
```

---

## Key Components and Pages

### Components (Reusable UI)

| File | Purpose |
|------|---------|
| `Sidebar.jsx` | Left navigation menu with links to all pages |
| `Toast.jsx` | Global floating notification messages |
| `Toast.css` | Styles for toast notifications |

### Pages (Route-level Views)

| File | Route | Purpose |
|------|-------|---------|
| `LandingPage.jsx` | `/` | Marketing landing page |
| `Dashboard.jsx` | `/dashboard` | Summary stats + recent sales |
| `Farmers.jsx` | `/farmers` | Farmer CRUD + Smart Advice |
| `Land.jsx` | `/land` | Land records management |
| `Crops.jsx` | `/crops` | Crop records management |
| `Harvests.jsx` | `/harvests` | Harvest records + profit tracking |
| `Expenses.jsx` | `/expenses` | Expense tracking per land |
| `Activities.jsx` | `/activities` | Chemical/pesticide usage log |
| `Products.jsx` | `/products` | Product catalog |
| `Sales.jsx` | `/sales` | Sales transactions |
| `Reports.jsx` | `/reports` | Analytical reports (stored procedures) |
| `Fertilizers.jsx` | `/fertilizers` | Fertilizer dosage recommendations |
| `Market.jsx` | `/market` | Exporter/buyer market rates |
| `Notifications.jsx` | `/notifications` | Smart farming reminders |
| `SoilReports.jsx` | `/soil-reports` | Soil test analysis + NPK suggestions |
| `AgriGuide.jsx` | `/agri-guide` | Disease/pesticide and SOP guide |

### Context

| File | Purpose |
|------|---------|
| `context/LanguageContext.jsx` | Global language (English/Marathi) with `useLanguage()` hook |
| `translations.js` | All UI text translations in key-value format |

---

## Filter & Sort Flow (Example: Farmers Page)

```
User changes "Sort By" dropdown to "Name"
         ↓
onChange={e => setSortBy(e.target.value)}   ← sets sortBy = 'name'
         ↓
useEffect dependency [sortBy, order, filterLoc] changes
         ↓
fetchFarmers() runs again with new params
         ↓
API.get('/farmers?sort_by=name&order=desc')
         ↓
Flask returns data sorted by name
         ↓
setFarmers(res.data) → re-render → sorted list on screen
```

---

## Edit (Modal) Flow

```
User clicks "Edit" button on a farmer row
         ↓
onClick={() => setEditItem({...f})}    ← copies farmer data into state
         ↓
{editItem && <div className="modal-overlay">...</div>}
         ↓
Modal appears with pre-filled inputs
         ↓
User changes name/location in modal form
         ↓
onChange={e => setEditItem({...editItem, name: e.target.value})}
         ↓
User clicks "Save Changes" → handleUpdate() runs
         ↓
API.put(`/farmers/${editItem.farmer_id}`, editItem)
         ↓
Flask updates the record → 200 OK
         ↓
setEditItem(null)  ← closes modal
fetchFarmers()     ← refreshes the list
```

---

## Delete Flow

```
User clicks "Delete" button (trash icon)
         ↓
if (!confirm('Delete this farmer?')) return;   ← browser confirmation dialog
         ↓
User clicks "OK"
         ↓
API.delete(`/farmers/${id}`)
         ↓
Flask deletes record → 200 OK
         ↓
fetchFarmers()  ← list refreshes without the deleted farmer
```

---

## Loading States

Every page shows a loading spinner while data is being fetched:

```jsx
{loading ? (
  <div className="loading">
    <div className="spinner"></div>
    <span>Loading...</span>
  </div>
) : farmers.length === 0 ? (
  <div className="empty-state">No farmers yet</div>
) : (
  <table>...</table>   // Show actual data
)}
```

This 3-state pattern (loading → empty → data) is used consistently across all pages.
