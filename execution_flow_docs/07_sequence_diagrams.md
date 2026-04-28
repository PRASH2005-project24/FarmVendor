# 07 — Sequence Diagrams

## Text-Based Sequence Diagrams for Key Interactions

---

## Diagram 1: Button Click → Data Fetch (View Farmers)

```
User         Browser/React      Axios            Flask (app.py)    MySQL
 |                |                |                   |               |
 |  Navigate to   |                |                   |               |
 |  /farmers      |                |                   |               |
 |--------------->|                |                   |               |
 |                |                |                   |               |
 |                | useEffect()    |                   |               |
 |                | fires on mount |                   |               |
 |                |                |                   |               |
 |                | API.get(       |                   |               |
 |                | '/farmers?..') |                   |               |
 |                |--------------->|                   |               |
 |                |                |                   |               |
 |                |                | GET /api/farmers  |               |
 |                |                |------------------>|               |
 |                |                |                   |               |
 |                |                |                   | get_db()      |
 |                |                |                   |-------------->|
 |                |                |                   |               |
 |                |                |                   | SELECT *      |
 |                |                |                   | FROM farmer   |
 |                |                |                   | ORDER BY...   |
 |                |                |                   |-------------->|
 |                |                |                   |               |
 |                |                |                   |    Rows []    |
 |                |                |                   |<--------------|
 |                |                |                   |               |
 |                |                |                   | cursor.close()|
 |                |                |                   | conn.close()  |
 |                |                |                   |               |
 |                |                |   200 OK + JSON   |               |
 |                |                |<------------------|               |
 |                |                |                   |               |
 |                | .then(res =>   |                   |               |
 |                | setFarmers(    |                   |               |
 |                |   res.data))   |                   |               |
 |                |                |                   |               |
 |                | Re-render:     |                   |               |
 |                | Show farmer    |                   |               |
 |                | table rows     |                   |               |
 |                |                |                   |               |
 | Sees farmer    |                |                   |               |
 | list on screen |                |                   |               |
 |<---------------|                |                   |               |
```

**Key Observations:**
- `useEffect` fires automatically when component mounts
- While waiting for response, `loading=true` shows spinner
- `setFarmers()` causes re-render → table appears

---

## Diagram 2: Insert Data → Database → Response (Add Farmer)

```
User         Farmers.jsx        Axios           Flask             MySQL
 |                |                |                |                |
 | Types name &   |                |                |                |
 | location in    |                |                |                |
 | form inputs    |                |                |                |
 |--------------->|                |                |                |
 |                |                |                |                |
 |                | onChange()     |                |                |
 |                | setForm({...}) |                |                |
 |                | [state update] |                |                |
 |                |                |                |                |
 | Clicks "Add    |                |                |                |
 | Farmer" button |                |                |                |
 |--------------->|                |                |                |
 |                |                |                |                |
 |                | handleSubmit() |                |                |
 |                | e.preventDefault()             |                |
 |                | validate form  |                |                |
 |                |                |                |                |
 |                | API.post(      |                |                |
 |                | '/farmers',    |                |                |
 |                |  form)         |                |                |
 |                |--------------->|                |                |
 |                |                |                |                |
 |                |                | POST /api/     |                |
 |                |                | farmers        |                |
 |                |                | Body: {name,   |                |
 |                |                | location}      |                |
 |                |                |--------------->|                |
 |                |                |                |                |
 |                |                |                | get_db()       |
 |                |                |                | (pool)         |
 |                |                |                |--------------->|
 |                |                |                |                |
 |                |                |                | gen_id('F',    |
 |                |                |                | 'farmer')      |
 |                |                |                |                |
 |                |                |                | SELECT         |
 |                |                |                | farmer_id      |
 |                |                |                | FROM farmer    |
 |                |                |                |--------------->|
 |                |                |                |    [F1, F2]   |
 |                |                |                |<---------------|
 |                |                |                | max=2, id="F3" |
 |                |                |                |                |
 |                |                |                | INSERT INTO    |
 |                |                |                | farmer VALUES  |
 |                |                |                | (F3, name, loc)|
 |                |                |                |--------------->|
 |                |                |                |                |
 |                |                |                |  Row inserted  |
 |                |                |                |<---------------|
 |                |                |                |                |
 |                |                |                | conn.commit()  |
 |                |                |                |--------------->|
 |                |                |                | Committed ✓   |
 |                |                |                |<---------------|
 |                |                |                |                |
 |                |                |   201 Created  |                |
 |                |                |   {id:"F3",    |                |
 |                |                |   message:...} |                |
 |                |                |<---------------|                |
 |                |                |                |                |
 |                | .then() runs   |                |                |
 |                | setForm({})    |                |                |
 |                | fetchFarmers() |                |                |
 |                |                |                |                |
 |                |     [GET /api/farmers fires again — full flow]   |
 |                |                |                |                |
 | Sees form      |                |                |                |
 | cleared &      |                |                |                |
 | new farmer in  |                |                |                |
 | table          |                |                |                |
 |<---------------|                |                |                |
```

---

## Diagram 3: Smart Crop Recommendation System

```
User        Farmers.jsx       Axios         Flask             MySQL
 |               |               |               |               |
 | Clicks "💡    |               |               |               |
 | Advice" for   |               |               |               |
 | Farmer F1     |               |               |               |
 |-------------->|               |               |               |
 |               |               |               |               |
 |               | handleGet     |               |               |
 |               | Suggestion(   |               |               |
 |               |   'F1')       |               |               |
 |               | setLoading    |               |               |
 |               | Suggestion(   |               |               |
 |               |   true)       |               |               |
 |               |               |               |               |
 |               | API.get(      |               |               |
 |               | '/smart-      |               |               |
 |               | suggestions/  |               |               |
 |               | F1')          |               |               |
 |               |-------------->|               |               |
 |               |               |               |               |
 |               |               | GET /api/     |               |
 |               |               | smart-        |               |
 |               |               | suggestions/  |               |
 |               |               | F1            |               |
 |               |               |-------------->|               |
 |               |               |               |               |
 |               |               |               | QUERY 1:      |
 |               |               |               | SELECT        |
 |               |               |               | soil_type     |
 |               |               |               | FROM land     |
 |               |               |               | WHERE         |
 |               |               |               | farmer_id=F1  |
 |               |               |               |-------------->|
 |               |               |               | ['Black Soil']|
 |               |               |               |<--------------|
 |               |               |               |               |
 |               |               |               | QUERY 2:      |
 |               |               |               | SELECT crop,  |
 |               |               |               | SUM(profit),  |
 |               |               |               | ROI calc      |
 |               |               |               | FROM harvest  |
 |               |               |               | JOIN crop     |
 |               |               |               | ORDER BY roi  |
 |               |               |               |-------------->|
 |               |               |               | Ranked crops  |
 |               |               |               | by ROI        |
 |               |               |               |<--------------|
 |               |               |               |               |
 |               |               |               | Python logic: |
 |               |               |               | SOIL_CROP_MAP |
 |               |               |               | ['Black Soil']|
 |               |               |               | = [Cotton,    |
 |               |               |               |  Sugarcane,  |
 |               |               |               |  Wheat...]    |
 |               |               |               |               |
 |               |               |               | Match loop:   |
 |               |               |               | Tomato in list|
 |               |               |               | ? No.         |
 |               |               |               | Cotton in list|
 |               |               |               | ? Yes! ✓      |
 |               |               |               |               |
 |               |               | 200 OK        |               |
 |               |               | {crop:"Cotton"|               |
 |               |               | basis:"..."}  |               |
 |               |               |<--------------|               |
 |               |               |               |               |
 |               | setSuggestion |               |               |
 |               | Data(res.data)|               |               |
 |               | setLoading    |               |               |
 |               | Suggestion(   |               |               |
 |               |   false)      |               |               |
 |               |               |               |               |
 |               | Modal renders:|               |               |
 |               | "Recommended  |               |               |
 |               |  Crop: Cotton"|               |               |
 |               |               |               |               |
 | Sees modal    |               |               |               |
 | with crop     |               |               |               |
 | suggestion    |               |               |               |
 |<--------------|               |               |               |
```

---

## Diagram 4: Sales INSERT with Trigger (Audit Log)

```
User         Sales.jsx         Flask          MySQL          audit_log
 |               |                |               |               |
 | Submits new   |                |               |               |
 | sale form     |                |               |               |
 |-------------->|                |               |               |
 |               |                |               |               |
 |               | API.post(      |               |               |
 |               | '/sales',      |               |               |
 |               | saleData)      |               |               |
 |               |--------------->|               |               |
 |               |                |               |               |
 |               |                | gen_id('S',   |               |
 |               |                | 'sales')→'S11'|               |
 |               |                |               |               |
 |               |                | INSERT INTO   |               |
 |               |                | sales VALUES  |               |
 |               |                | (S11,...)     |               |
 |               |                |-------------->|               |
 |               |                |               |               |
 |               |                |               | Row inserted  |
 |               |                |               | to sales table|
 |               |                |               |               |
 |               |                |               | TRIGGER FIRES:|
 |               |                |               | trg_log_sale_ |
 |               |                |               | insert        |
 |               |                |               |-------------->|
 |               |                |               |               |
 |               |                |               | INSERT INTO   |
 |               |                |               | audit_log     |
 |               |                |               | (sales,INSERT |
 |               |                |               |  S11, details)|
 |               |                |               |<--------------|
 |               |                |               |               |
 |               |                | conn.commit() |               |
 |               |                |-------------->|               |
 |               |                | Both sales +  |               |
 |               |                | audit_log     |               |
 |               |                | permanently   |               |
 |               |                | saved         |               |
 |               |                |               |               |
 |               |                |  201 Created  |               |
 |               |                |  {id:"S11"}   |               |
 |               |<---------------|               |               |
 |               |                |               |               |
 |               | fetchSales()   |               |               |
 |               | [refreshes list]               |               |
 |               |                |               |               |
 | Sees new sale |                |               |               |
 | in table      |                |               |               |
 |<--------------|                |               |               |
```

**Note:** The trigger fires inside MySQL automatically — Flask does not call it. It's invisible to the developer but always runs on every INSERT to `sales`.

---

## Diagram 5: Stored Procedure Call (Reports)

```
User         Reports.jsx       Flask            MySQL SP         MySQL Tables
 |               |                |                |                |
 | Clicks        |                |                |                |
 | "Farmer       |                |                |                |
 | Summary"      |                |                |                |
 |-------------->|                |                |                |
 |               |                |                |                |
 |               | API.get(       |                |                |
 |               | '/reports/     |                |                |
 |               | farmer-summary'|                |                |
 |               |--------------->|                |                |
 |               |                |                |                |
 |               |                | cursor.callproc|                |
 |               |                | ('sp_farmer_   |                |
 |               |                | summary')      |                |
 |               |                |--------------->|                |
 |               |                |                |                |
 |               |                |                | OPEN cursor    |
 |               |                |                | (SELECT        |
 |               |                |                | farmers)       |
 |               |                |                |--------------->|
 |               |                |                | All farmers    |
 |               |                |                |<---------------|
 |               |                |                |                |
 |               |                |                | For F1:        |
 |               |                |                |  COUNT(land)   |
 |               |                |                |  SUM(expense)  |
 |               |                |                |  SUM(profit)   |
 |               |                |                |--------------->|
 |               |                |                |   Numbers      |
 |               |                |                |<---------------|
 |               |                |                |                |
 |               |                |                | INSERT row to  |
 |               |                |                | temp table     |
 |               |                |                |                |
 |               |                |                | For F2:        |
 |               |                |                |   [same loop]  |
 |               |                |                |                |
 |               |                |                | CLOSE cursor   |
 |               |                |                | SELECT * FROM  |
 |               |                |                | tmp_farmer_    |
 |               |                |                | summary        |
 |               |                |                |--------------->|
 |               |                |                | Final results  |
 |               |                |                |<---------------|
 |               |                |                | DROP temp table|
 |               |                |                |                |
 |               |                | stored_results(|                |
 |               |                | ) → rows       |                |
 |               |                | Convert Decimal|                |
 |               |                | to float       |                |
 |               |                |                |                |
 |               |                | 200 OK + JSON  |                |
 |               |<---------------|                |                |
 |               |                |                |                |
 |               | setData()      |                |                |
 |               | render table   |                |                |
 |               |                |                |                |
 | Sees farmer   |                |                |                |
 | summary table |                |                |                |
 |<--------------|                |                |                |
```

---

## Diagram 6: Expense Validation Trigger Rejection

```
User         Expenses.jsx       Flask           MySQL             React
 |                |                |               |                |
 | Enters         |                |               |                |
 | amount = -500  |                |               |                |
 |--------------->|                |               |                |
 |                |                |               |                |
 |                | API.post(      |                               |
 |                | '/expenses',   |                               |
 |                | {amount:-500}) |                               |
 |                |--------------->|                               |
 |                |                |               |               |
 |                |                | INSERT INTO   |               |
 |                |                | expense ...   |               |
 |                |                | amount=-500   |               |
 |                |                |-------------->|               |
 |                |                |               |               |
 |                |                |               | TRIGGER FIRES:|
 |                |                |               | trg_validate_ |
 |                |                |               | expense_amount|
 |                |                |               |               |
 |                |                |               | IF amount<=0  |
 |                |                |               | SIGNAL ERROR  |
 |                |                |               | 'Expense      |
 |                |                |               | amount must   |
 |                |                |               | be > zero'    |
 |                |                |               |               |
 |                |                | MySQL throws  |               |
 |                |                | exception     |               |
 |                |                |<--------------|               |
 |                |                |               |               |
 |                |                | except clause |               |
 |                |                | catches error |               |
 |                |                |               |               |
 |                |                | return 500 +  |               |
 |                |                | {"error":"... |               |
 |                |                |  must be >0"} |               |
 |                |<---------------|               |               |
 |                |                |               |               |
 |                | .catch()       |               |               |
 |                | alert('Error:  |               |               |
 |                | ...')          |               |               |
 |                |                |               |               |
 | Sees error     |                |               |               |
 | alert dialog   |                |               |               |
 |<---------------|                |               |               |
```

---

## Diagram 7: Soil Report Analysis (In-Browser Logic)

```
User        SoilReports.jsx     Axios            Flask           MySQL
 |                |                |                |               |
 | Navigates to   |                |                |               |
 | /soil-reports  |                |                |               |
 |--------------->|                |                |               |
 |                |                |                |               |
 |                | Promise.all([  |                |               |
 |                |  GET /soil-    |                |               |
 |                |    reports,    |                |               |
 |                |  GET /land,    |                |               |
 |                |  GET /crops    |                |               |
 |                | ])             |                |               |
 |                |--------------->|                |               |
 |                |                | 3 parallel     |               |
 |                |                | requests sent  |               |
 |                |                |--------------->|               |
 |                |                |                | 3 SQL queries |
 |                |                |                | execute in DB |
 |                |                |                |-------------->|
 |                |                |                |  Results      |
 |                |                |                |<--------------|
 |                |                | 3 responses    |               |
 |                |                |<---------------|               |
 |                |                |                |               |
 |                | .then([reps,   |                |               |
 |                |  lands,crops]) |                |               |
 |                | setReports()   |                |               |
 |                | setLands()     |                |               |
 |                | setCrops()     |                |               |
 |                |                |                |               |
 |                | For each report card:           |               |
 |                | getSuggestions(report)          |               |
 |                | [Pure JS - NO API call]         |               |
 |                |                |               |               |
 |                | Checks pH:     |               |               |
 |                | 6.80 < 5.5? NO |               |               |
 |                | 6.80 > 8.0? NO |               |               |
 |                | → "✅ pH good" |               |               |
 |                |                |               |               |
 |                | Checks N=280:  |               |               |
 |                | 280 > 300? NO  |               |               |
 |                | 280 > 200? YES |               |               |
 |                | → "✅ N good"  |               |               |
 |                |                |               |               |
 |                | Checks P=22.5: |               |               |
 |                | 22.5 < 15? NO  |               |               |
 |                | 22.5 < 25? YES |               |               |
 |                | → "🟡 Medium P"|               |               |
 |                |                |               |               |
 |                | getGaugeColor: |               |               |
 |                | pH=6.8 → green |               |               |
 |                | P=22.5 → amber |               |               |
 |                |                |               |               |
 |                | Render cards   |               |               |
 |                | with colored   |               |               |
 |                | metrics        |               |               |
 |                |                |               |               |
 | Sees           |                |               |               |
 | color-coded    |                |               |               |
 | soil cards     |                |               |               |
 | with tips      |                |               |               |
 |<---------------|                |               |               |
```

---

## Summary: All Diagrams at a Glance

| Diagram | Feature | API Called | DB Operation |
|---------|---------|------------|--------------|
| 1 | View Farmers | GET /api/farmers | SELECT * FROM farmer |
| 2 | Add Farmer | POST /api/farmers | INSERT + gen_id |
| 3 | Smart Crop Advice | GET /api/smart-suggestions/F1 | 2 JOINs + Python ROI |
| 4 | Record Sale | POST /api/sales | INSERT + AUTO TRIGGER |
| 5 | Farmer Report | GET /api/reports/farmer-summary | CALL sp_farmer_summary |
| 6 | Invalid Expense | POST /api/expenses (amount<0) | TRIGGER rejects |
| 7 | Soil Analysis | GET /api/soil-reports | SELECT + JS logic |
