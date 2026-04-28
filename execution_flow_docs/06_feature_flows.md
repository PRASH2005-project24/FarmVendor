# 06 — Feature Flow Documentation

## Key Features — Step-by-Step Execution

---

## Feature 1: Add Farmer

**UI Location:** `/farmers` page → "Add New Farmer" form

### Complete Execution Path

```
Step 1: User fills in form fields
─────────────────────────────────
File: frontend/src/pages/Farmers.jsx

const [form, setForm] = useState({ name: '', location: '' });

<input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
<input value={form.location} onChange={e => setForm({...form, location: e.target.value})} />

→ Each keystroke updates the 'form' state via setForm()
→ React re-renders input with new value (controlled input)

Step 2: User clicks "Add Farmer" button (type="submit")
─────────────────────────────────────────────────────────
→ HTML <form onSubmit={handleSubmit}> fires

Step 3: handleSubmit() runs
────────────────────────────
const handleSubmit = (e) => {
  e.preventDefault();              // Prevents page reload
  if (!form.name.trim()) return;   // Validation: name required
  
  API.post('/farmers', form)       // Axios sends POST request
    .then(() => {
      setForm({ name: '', location: '' });  // Clear form
      fetchFarmers();                        // Reload list
    })
    .catch(err => alert('Error: ' + err.message));
};

Step 4: Axios sends HTTP request
─────────────────────────────────
POST http://localhost:5000/api/farmers
Content-Type: application/json
Body: { "name": "Raju Shelar", "location": "Solapur" }

Step 5: Flask receives and processes
─────────────────────────────────────
@app.route('/api/farmers', methods=['GET', 'POST'])
def handle_farmers():
  conn = get_db()                          # Borrow DB connection from pool
  cursor = conn.cursor(dictionary=True)
  data = request.json                      # Parse body: {"name":"Raju Shelar",...}
  fid = gen_id('F', 'farmer')             # Generate ID: queries farmer table,
                                           # finds max number (e.g. F2), returns F3
  cursor.execute(
    "INSERT INTO farmer (farmer_id, name, location) VALUES (%s, %s, %s)",
    ('F3', 'Raju Shelar', 'Solapur')      # Parameterized = SQL injection safe
  )
  conn.commit()                            # Save to disk permanently
  return jsonify({"id": "F3", "message": "Farmer added"}), 201

Step 6: MySQL executes the INSERT
───────────────────────────────────
INSERT INTO farmer (farmer_id, name, location)
VALUES ('F3', 'Raju Shelar', 'Solapur')
→ Row is added to farmer table
→ created_at is set automatically by DEFAULT CURRENT_TIMESTAMP

Step 7: Flask returns 201 Created
───────────────────────────────────
{ "id": "F3", "message": "Farmer added" }

Step 8: React updates the UI
──────────────────────────────
.then(() => {
  setForm({ name: '', location: '' });  // Form clears
  fetchFarmers();                        // GET /api/farmers fires again
})
→ setFarmers(res.data) → React re-renders → New farmer "Raju Shelar" appears in table
```

**Total Time:** ~100-200ms (network + DB write)

---

## Feature 2: View Data (Dashboard)

**UI Location:** `/dashboard`

### Complete Execution Path

```
Step 1: User navigates to /dashboard
──────────────────────────────────────
React Router matches <Route path="/dashboard" element={<Dashboard />} />
→ Dashboard component mounts

Step 2: useEffect triggers data fetch
────────────────────────────────────
useEffect(() => {
  API.get('/dashboard')
    .then(res => setStats(res.data))
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
}, []);           // [] = run only on first mount

Step 3: While loading → show spinner
───────────────────────────────────
if (loading) return <div className="loading"><div className="spinner"/></div>

Step 4: Flask runs 9 queries
───────────────────────────────
cursor.execute("SELECT COUNT(*) FROM farmer")        → totalFarmers
cursor.execute("SELECT COUNT(*) FROM product")        → totalProducts
cursor.execute("SELECT COALESCE(SUM(price * quantity_Kg), 0) FROM sales") → totalRevenue
cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM expense")  → totalExpenses
cursor.execute("SELECT COUNT(*) FROM sales")          → totalSales
cursor.execute("SELECT COUNT(*) FROM crop")           → totalCrops
cursor.execute("SELECT COUNT(*) FROM harvest")        → totalHarvests
cursor.execute("SELECT COUNT(*) FROM land")           → totalLands
cursor.execute("SELECT COUNT(*) FROM activity")       → totalActivities

cursor.execute("""
  SELECT s.sale_id, s.sale_date, p.product_name, s.quantity_Kg, s.price,
         (s.price * s.quantity_Kg) as total
  FROM sales s
  JOIN product p ON s.product_id = p.product_id
  ORDER BY s.created_at DESC LIMIT 5
""")                                                  → recentSales (last 5)

Step 5: Flask returns combined JSON
─────────────────────────────────────
{
  "totalFarmers": 3, "totalRevenue": 4825.0, ...,
  "netProfit": -180221.0,
  "recentSales": [ {sale details...} ]
}

Step 6: React updates stats state
───────────────────────────────────
setStats(res.data)
setLoading(false)

→ Dashboard re-renders with:
  - 9 stat cards (farmers, revenue, expenses, net profit, etc.)
  - Recent sales table (last 5 transactions)
```

---

## Feature 3: Smart Crop Recommendation (ROI Logic)

**UI Location:** `/farmers` page → "💡 Advice" button on each farmer row

### Complete Execution Path

```
Step 1: User clicks "💡 Advice" button for Farmer F1
──────────────────────────────────────────────────────
onClick={() => handleGetSuggestion(f.farmer_id)}

const handleGetSuggestion = (farmerId) => {
  setLoadingSuggestion(true);
  API.get(`/smart-suggestions/${farmerId}`)
    .then(res => setSuggestionData(res.data))
    .finally(() => setLoadingSuggestion(false));
};

Step 2: Axios calls Flask
──────────────────────────
GET http://localhost:5000/api/smart-suggestions/F1

Step 3: Flask executes farmer_smart_suggestions('F1')
───────────────────────────────────────────────────────

SUB-STEP 3a: Get farmer's soil types
  SQL: SELECT soil_type FROM land WHERE farmer_id = 'F1' AND soil_type IS NOT NULL
  Result: ['Black Soil']   (from land L1 of farmer F1)

SUB-STEP 3b: Find all crops ranked by ROI from historical harvests
  SQL:
    SELECT c.crop_name,
           SUM(h.total_cost) as total_cost,
           SUM(h.profit) as total_profit,
           (SUM(h.profit) / NULLIF(SUM(h.total_cost), 1)) * 100 as roi_percentage
    FROM harvest h
    JOIN crop c ON h.crop_id = c.crop_id
    GROUP BY c.crop_name
    ORDER BY roi_percentage DESC

  Returns ranked list:
  [
    { crop_name: "Tomato",  total_cost: 1197500, total_profit: 35000, roi: 2.9% },
    { crop_name: "Potato",  total_cost: 1077750, total_profit: 19500, roi: 1.8% },
    { crop_name: "Cabbage", ...roi: 1.1% },
    ...
  ]

SUB-STEP 3c: Match high-ROI crops with soil-compatible crops (Python logic)
  soil = 'Black Soil'
  SOIL_CROP_MAP['Black Soil'] = ['Cotton', 'Sugarcane', 'Wheat', 'Jowar', 'Sunflower', 'Soybean']

  Loop through profitable_crops:
    "Tomato" in ['Cotton', 'Sugarcane', 'Wheat', ...] ? NO
    "Potato" in ['Cotton', 'Sugarcane', 'Wheat', ...] ? NO
    ...none match → fall back to first suitable crop for soil:

  recommended_crop = 'Cotton'
  basis = "Based on your Black Soil, we recommend Cotton as it thrives in this soil type."

  (If a match is found:)
  basis = "Based on your Black Soil, Tomato is highly recommended. 
           Cost: ₹1,197,500 vs Profit: ₹35,000 shows 2.9% ROI for this soil type."

Step 4: Flask returns recommendation
──────────────────────────────────────
{
  "farmer_id": "F1",
  "recommended_crop": "Cotton",
  "basis": "Based on your Black Soil, we recommend Cotton..."
}

Step 5: React shows modal
──────────────────────────
setSuggestionData(res.data)
→ {suggestionData && <div className="modal-overlay">...} renders
→ Modal appears with:
  - 🌱 emoji
  - "Recommended Crop: Cotton"
  - Full basis explanation text
```

---

## Feature 4: Soil Report Analysis

**UI Location:** `/soil-reports`

### Complete Execution Path

```
Step 1: Page loads — fetches reports, lands, and crops simultaneously
────────────────────────────────────────────────────────────────────
Promise.all([
  API.get('/soil-reports'),   // All soil reports with land + farmer info
  API.get('/land'),            // All lands (for dropdown)
  API.get('/crops'),           // All crops (for optional crop dropdown)
])
→ setReports, setLands, setCrops

Step 2: User views a soil report card
───────────────────────────────────────
Each report card displays:
  - Report ID, land area, location, farmer name
  - pH level (color coded: red/yellow/green)
  - N, P, K, OC values (color coded by health thresholds)

Step 3: getSuggestions(report) runs in-browser (no API call needed)
────────────────────────────────────────────────────────────────────
This is pure JavaScript logic — no API call:

const getSuggestions = (report) => {
  const tips = [];

  // pH analysis
  if (report.ph_level < 5.5)       tips.push('⚠️ Too acidic — apply lime');
  else if (report.ph_level < 6.0)  tips.push('🟡 Slightly acidic — consider lime');
  else if (report.ph_level > 8.0)  tips.push('⚠️ Too alkaline — apply gypsum');
  else if (report.ph_level > 7.5)  tips.push('🟡 Add organic matter');
  else                             tips.push('✅ pH is in good range (6.0–7.5)');

  // Nitrogen analysis
  if (report.nitrogen < 200)       tips.push('🔴 Low Nitrogen — apply Urea');
  else if (report.nitrogen < 300)  tips.push('🟡 Medium Nitrogen');
  else                             tips.push('✅ Nitrogen levels are good');

  // Phosphorus analysis
  if (report.phosphorus < 15)      tips.push('🔴 Low Phosphorus — apply DAP');
  else if (report.phosphorus < 25) tips.push('🟡 Medium Phosphorus');
  else                             tips.push('✅ Phosphorus levels are good');

  // Potassium analysis
  if (report.potassium < 150)      tips.push('🔴 Low Potassium — apply MOP');
  else if (report.potassium < 250) tips.push('🟡 Medium Potassium');
  else                             tips.push('✅ Potassium levels are good');

  return tips;
};

Step 4: Color coding via getGaugeColor()
──────────────────────────────────────────
const getGaugeColor = (value, low, high) => {
  if (value < low)  return '#ef4444';   // Red — deficient
  if (value < high) return '#f59e0b';   // Yellow — marginal
  return '#22c55e';                      // Green — optimal
};

Example: pH = 6.80, low=6.0, high=7.5
→ 6.80 is between 6.0 and 7.5 → color = '#22c55e' (green)

Step 5: Tips displayed under each report card
───────────────────────────────────────────────
{tips.length > 0 && (
  <div className="soil-suggestions">
    <strong>💡 Suggestions:</strong>
    <ul>{tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
  </div>
)}

Example for SR1 (L1, pH=6.80, N=280, P=22.5, K=180):
  ✅ pH is in good range (6.0-7.5)
  ✅ Nitrogen levels are good
  🟡 Medium Phosphorus — use phosphate fertilizer
  🟡 Medium Potassium — use potash-based fertilizer

Step 6: User adds a new soil report
─────────────────────────────────────
Form fields: land_id (required), ph_level, nitrogen, phosphorus, potassium, organic_carbon, report_date, notes

API.post('/soil-reports', {
  land_id: 'L1',
  ph_level: parseFloat(form.ph_level) || null,  // Convert string to number
  nitrogen: parseFloat(form.nitrogen) || null,
  ...
})

Flask generates ID:
  gen_id('SR', 'soil_report') → 'SR3'

SQL:
  INSERT INTO soil_report 
  (report_id, land_id, ph_level, nitrogen, phosphorus, potassium, organic_carbon, report_date, notes)
  VALUES ('SR3', 'L1', 6.5, 250.0, 20.0, 160.0, 0.55, '2026-04-24', 'Lab test')

Step 7: Page refreshes with new report
────────────────────────────────────────
fetchData() runs again → new report card appears instantly with its color-coded metrics
```

---

## Feature 5: Fertilizer Dosage Recommendations

**UI Location:** `/fertilizers`

```
Step 1: Page loads
  API.get('/fertilizer-dosages') + API.get('/crops')
  → Shows dosage records grouped by crop

Step 2: User filters by crop (e.g., Tomato C1)
  GET /api/fertilizer-dosages?crop_id=C1
  SQL: SELECT fd.*, c.crop_name FROM fertilizer_dosage fd
       LEFT JOIN crop c ON fd.crop_id = c.crop_id
       WHERE fd.crop_id = 'C1'
  Returns: 3 dosage records (10:26:26, Urea, Calcium Nitrate)

Step 3: Each record shows:
  - Fertilizer name
  - Quantity
  - Application stage (e.g., "At planting")
  - Notes
```

---

## Feature 6: Market / Exporter Search

**UI Location:** `/market`

```
Step 1: Load all exporters
  GET /api/exporters
  
Step 2: User searches for "Sugarcane" exporters
  GET /api/exporters?crop_product=Sugarcane
  SQL: SELECT * FROM exporter WHERE crop_product LIKE '%Sugarcane%' ORDER BY created_at DESC

Step 3: Results displayed with:
  - Exporter name, type (Factory/Trader/Cooperative)
  - Current rate (e.g., ₹3150 per tonne)
  - Distance (e.g., 25 km)
  - Contact info
```

---

## Feature 7: View Reports (Stored Procedures)

**UI Location:** `/reports`

```
Step 1: User clicks "Farmer Summary" tab
  API.get('/reports/farmer-summary')
         ↓
Step 2: Flask calls stored procedure
  cursor.callproc('sp_farmer_summary')
         ↓
Step 3: MySQL stored procedure executes
  CURSOR opens → iterates farmers one by one
  For each farmer:
    - Counts their land records
    - Sums their total expenses (JOIN expense + land)
    - Sums harvest profits (JOIN harvest + crop)
  Inserts row into temp table tmp_farmer_summary
  Returns SELECT * FROM tmp_farmer_summary
         ↓
Step 4: Flask collects stored procedure results
  for result in cursor.stored_results():
    rows = result.fetchall()
  Converts Decimal to float
  Returns JSON
         ↓
Step 5: React displays tabular report
  Shows: Farmer | Location | Lands | Total Expenses | Harvest Profit
```
