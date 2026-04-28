# 05 — API Flow Documentation

## Complete REST API Reference

**Base URL (Dev):** `http://localhost:5000/api`  
**Base URL (Prod):** `/api`  
**Format:** All requests and responses use `Content-Type: application/json`

---

## 1. Dashboard

### `GET /api/dashboard`

**Purpose:** Fetch aggregated statistics for the dashboard page.

**Request:** No body, no query params.

**Response:**
```json
{
  "totalFarmers": 2,
  "totalProducts": 7,
  "totalRevenue": 4825.0,
  "totalExpenses": 185046.0,
  "totalSales": 10,
  "totalCrops": 6,
  "totalHarvests": 6,
  "totalLands": 2,
  "totalActivities": 8,
  "netProfit": -180221.0,
  "recentSales": [
    {
      "sale_id": "S10", "sale_date": "2026-04-21",
      "product_name": "Kanda", "quantity_Kg": 8.0,
      "price": 60.0, "total": 480.0
    }
  ]
}
```

**Execution Flow:**
```
GET /api/dashboard
  ↓ dashboard() function
  ↓ 9 separate COUNT/SUM queries on different tables
  ↓ JOIN query for last 5 sales (sales + product)
  ↓ Build response dict
  ↓ Return 200 JSON
```

---

## 2. Farmers API

### `GET /api/farmers`

**Purpose:** Get all farmers (with optional filter and sort).

**Query Params:**

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| sort_by | string | `name` | Sort column: `name`, `location`, `farmer_id`, `created_at` |
| order | string | `asc` | `asc` or `desc` |
| location | string | `Pune` | Filter by location (partial match) |

**Response:**
```json
[
  { "farmer_id": "F1", "name": "Mrs. Sunita Patil", "location": "Pune", "created_at": "2026-04-23 12:00:00" },
  { "farmer_id": "F2", "name": "Mr. Ramesh Jadhav", "location": "Nashik", "created_at": "2026-04-23 12:00:00" }
]
```

**SQL Generated:**
```sql
SELECT * FROM farmer WHERE location LIKE '%Pune%' ORDER BY name ASC
```

---

### `POST /api/farmers`

**Purpose:** Add a new farmer.

**Request Body:**
```json
{ "name": "Raju Shelar", "location": "Solapur" }
```

**Response (201 Created):**
```json
{ "id": "F3", "message": "Farmer added" }
```

**Execution Flow:**
```
POST /api/farmers
  ↓ Parse JSON body
  ↓ gen_id('F', 'farmer') → "F3"
  ↓ INSERT INTO farmer (farmer_id, name, location) VALUES ('F3', 'Raju Shelar', 'Solapur')
  ↓ conn.commit()
  ↓ Return 201
```

---

### `PUT /api/farmers/<farmer_id>`

**Purpose:** Update an existing farmer.

**Request Body:**
```json
{ "name": "Raju Shelar Updated", "location": "Kolhapur" }
```

**Response:**
```json
{ "message": "Farmer updated" }
```

---

### `DELETE /api/farmers/<farmer_id>`

**Purpose:** Delete a farmer (cascades to land, expenses, soil reports).

**Response:**
```json
{ "message": "Farmer deleted" }
```

---

## 3. Land API

### `GET /api/land`

**Query Params:** `farmer_id`, `location`, `sort_by`, `order`

**Response:**
```json
[
  {
    "land_id": "L1", "area": "2 Acres", "location": "Pune Rural",
    "soil_type": "Black Soil", "farmer_id": "F1",
    "farmer_name": "Mrs. Sunita Patil", "created_at": "..."
  }
]
```

**SQL:**
```sql
SELECT l.*, f.name as farmer_name
FROM land l
LEFT JOIN farmer f ON l.farmer_id = f.farmer_id
ORDER BY l.created_at DESC
```

---

### `POST /api/land`

**Request Body:**
```json
{ "area": "5 Acres", "location": "Nashik Hills", "soil_type": "Red Soil", "farmer_id": "F2" }
```

**Response:**
```json
{ "id": "L3", "message": "Land added" }
```

---

## 4. Crops API

### `GET /api/crops`

**Query Params:** `season` (filter), `sort_by`, `order`

**Response:**
```json
[
  { "crop_id": "C1", "crop_name": "Tomato", "season": "Kharif", "created_at": "..." }
]
```

---

### `POST /api/crops`

**Request Body:**
```json
{ "crop_name": "Maize", "season": "Kharif" }
```

**Response:**
```json
{ "id": "C7", "message": "Crop added" }
```

---

## 5. Products API

### `GET /api/products`

**Query Params:** `search` (name filter), `sort_by`, `order`

**Response:**
```json
[
  { "product_id": "P1", "product_name": "Tomato", "created_at": "..." }
]
```

---

### `POST /api/products`

**Request Body:**
```json
{ "product_name": "Brinjal" }
```

---

## 6. Sales API

### `GET /api/sales`

**Query Params:** `product_id`, `date_from`, `date_to`, `sort_by`, `order`

**Response:**
```json
[
  {
    "sale_id": "S1", "sale_date": "2026-05-07",
    "product_id": "P1", "product_name": "Tomato",
    "quantity_Kg": 1.0, "price": 100.0, "created_at": "..."
  }
]
```

**SQL:**
```sql
SELECT s.*, p.product_name
FROM sales s
LEFT JOIN product p ON s.product_id = p.product_id
WHERE s.sale_date >= '2026-04-01'
ORDER BY s.created_at DESC
```

**Trigger fires:** On every INSERT, `trg_log_sale_insert` writes to `audit_log`.

---

### `POST /api/sales`

**Request Body:**
```json
{ "sale_date": "2026-04-24", "product_id": "P1", "quantity_Kg": 10, "price": 120 }
```

**Response (201):**
```json
{ "id": "S11", "message": "Sale recorded" }
```

---

## 7. Expenses API

### `GET /api/expenses`

**Query Params:** `land_id`, `type`, `sort_by`, `order`

**Response:**
```json
[
  {
    "expense_id": "E1", "type": "Fertilizer", "amount": 2000.0,
    "expense_date": "2026-04-01", "land_id": "L1",
    "land_area": "2 Acres", "farmer_name": "Mrs. Sunita Patil"
  }
]
```

**SQL:**
```sql
SELECT e.*, l.area as land_area, f.name as farmer_name
FROM expense e
LEFT JOIN land l ON e.land_id = l.land_id
LEFT JOIN farmer f ON l.farmer_id = f.farmer_id
ORDER BY e.created_at DESC
```

---

### `POST /api/expenses`

**Request Body:**
```json
{ "type": "Seeds", "amount": 5000, "expense_date": "2026-04-24", "land_id": "L1" }
```

**Note:** If amount ≤ 0, MySQL trigger `trg_validate_expense_amount` rejects the INSERT with an error.

---

## 8. Activities API

### `GET /api/activities`

**Query Params:** `crop_id`, `chemical_name`, `sort_by`, `order`

**Response:**
```json
[
  {
    "activity_id": "A1", "crop_id": "C1", "land_id": "L1",
    "chemical_name": "Phosphoric Acid", "quantity": "85%",
    "activity_date": "2026-03-10", "crop_name": "Tomato"
  }
]
```

**Trigger fires:** On INSERT, `trg_log_activity_insert` and `trg_set_default_activity_date` both fire.

---

## 9. Harvests API

### `GET /api/harvests`

**Query Params:** `crop_id`, `season`, `sort_by`, `order`

**Response:**
```json
[
  {
    "harvest_id": "H1", "crop_id": "C1", "crop_name": "Tomato",
    "yield_amount": "500 kg", "total_cost": 958000.0,
    "profit": 8000.0, "harvest_date": "2026-05-01"
  }
]
```

**Triggers on INSERT:**
- `trg_set_default_harvest_date` — sets today's date if null
- `trg_prevent_negative_profit` — rejects if profit < 0

---

## 10. Fertilizer Dosages API

### `GET /api/fertilizer-dosages`

**Query Params:** `crop_id`, `search`, `sort_by`, `order`

**Response:**
```json
[
  {
    "dosage_id": "FD1", "crop_id": "C6", "crop_name": "Sugarcane",
    "fertilizer_name": "19:0:19", "quantity": "1 kg",
    "application_stage": "At planting", "notes": "..."
  }
]
```

---

## 11. Exporters / Market API

### `GET /api/exporters`

**Query Params:** `crop_product`, `exporter_type`, `sort_by`, `order`

**Response:**
```json
[
  {
    "exporter_id": "EX1", "exporter_name": "Baramati Sugar Factory",
    "exporter_type": "Factory", "crop_product": "Sugarcane",
    "current_rate": 3150.0, "rate_unit": "per tonne",
    "location": "Baramati, Pune", "distance_km": 25.0, "contact": "020-27121234"
  }
]
```

---

## 12. Soil Reports API

### `GET /api/soil-reports`

**Query Params:** `land_id`, `sort_by`, `order`

**Response:**
```json
[
  {
    "report_id": "SR1", "land_id": "L1", "land_area": "2 Acres",
    "farmer_name": "Mrs. Sunita Patil",
    "ph_level": 6.8, "nitrogen": 280.0, "phosphorus": 22.5,
    "potassium": 180.0, "organic_carbon": 0.65,
    "report_date": "2026-03-01"
  }
]
```

---

## 13. Notifications API

### `GET /api/notifications`

**Query Params:** `is_read` (true/false), `crop_id`

**Response:**
```json
[
  {
    "notification_id": 1, "crop_id": "C1", "crop_name": "Tomato",
    "title": "💧 Water Your Tomatoes",
    "message": "Apply 2-3 liters per plant",
    "notify_date": "2026-04-25", "is_read": false
  }
]
```

---

### `PUT /api/notifications/<id>/read`

**Response:**
```json
{ "message": "Notification marked as read" }
```

---

### `GET /api/notifications/unread-count`

**Response:**
```json
{ "count": 4 }
```

---

## 14. Reports API (Stored Procedures)

### `GET /api/reports/farmer-summary`

**Response:**
```json
[
  {
    "farmer_id": "F1", "farmer_name": "Mrs. Sunita Patil",
    "location": "Pune", "land_count": 1,
    "total_expense": 68699.0, "total_harvest_profit": 64950.0
  }
]
```

**Backend:** Calls MySQL stored procedure `sp_farmer_summary()` using a cursor.

---

### `GET /api/reports/monthly-sales`

**Response:**
```json
[
  { "sale_month": "2026-04", "total_sales": 5, "total_quantity_kg": 22.0, "total_revenue": 2380.0 },
  { "sale_month": "2026-05", "total_sales": 5, "total_quantity_kg": 6.0, "total_revenue": 2445.0 }
]
```

---

### `GET /api/reports/revenue-by-product`

**Response:**
```json
[
  { "product_id": "P7", "product_name": "Kanda", "total_sales": 1, "total_quantity_kg": 8.0, "total_revenue": 480.0 }
]
```

---

### `GET /api/reports/expense-by-land`

**Response:**
```json
[
  { "land_id": "L1", "area": "2 Acres", "farmer_name": "Mrs. Sunita Patil", "expense_count": 7, "total_expense": 68699.0 }
]
```

---

## 15. Audit Log API

### `GET /api/audit-log`

**Response:**
```json
[
  {
    "log_id": 1, "table_name": "sales", "action": "INSERT",
    "record_id": "S1",
    "details": "Product: P1, Qty: 1 kg, Price: Rs.100",
    "log_time": "2026-04-23 12:00:00"
  }
]
```

Returns last 50 audit entries, newest first.

---

## 16. Smart Suggestion APIs

### `GET /api/suggestions/crops-by-soil?soil_type=Black Soil`

**Response:**
```json
{ "soil_type": "Black Soil", "recommended_crops": ["Cotton", "Sugarcane", "Wheat", "Jowar", "Sunflower", "Soybean"] }
```

**No DB query** — data comes from `SOIL_CROP_MAP` Python dict.

---

### `GET /api/suggestions/fertility?soil_type=Red Soil`

**Response:**
```json
{
  "soil_type": "Red Soil",
  "suggestions": {
    "organic": ["Heavy compost application", "Poultry waste (2-3 tonnes/hectare)"],
    "chemical": ["Lime application to correct acidity", "Phosphorus-rich fertilizers (DAP)"],
    "tips": ["Add organic matter regularly", "Needs irrigation due to low water holding capacity"]
  }
}
```

---

### `GET /api/recommendations`

**Purpose:** Lists all crops ranked by historical average profit.

**Response:**
```json
[
  { "crop_id": "C1", "crop_name": "Tomato", "season": "Kharif",
    "harvest_count": 2, "avg_profit": 17500.0, "total_profit": 35000.0, "avg_cost": 598750.0 }
]
```

**SQL:**
```sql
SELECT c.crop_id, c.crop_name, c.season,
       COUNT(h.harvest_id) as harvest_count,
       AVG(h.profit) as avg_profit,
       SUM(h.profit) as total_profit,
       AVG(h.total_cost) as avg_cost
FROM crop c
LEFT JOIN harvest h ON c.crop_id = h.crop_id
GROUP BY c.crop_id, c.crop_name, c.season
HAVING harvest_count > 0
ORDER BY avg_profit DESC
```

---

### `GET /api/smart-suggestions/<farmer_id>`

**Purpose:** Personalized crop recommendation based on soil type + ROI analysis.

**Response:**
```json
{
  "farmer_id": "F1",
  "recommended_crop": "Tomato",
  "basis": "Based on your Black Soil, Tomato is highly recommended. Analysis of historical crop expenses (Cost: ₹958,000.00) vs Profit (₹35,000.00) shows it yields the highest Return on Investment (3.7%) for this soil type."
}
```

---

## 17. Agricultural Guide APIs

### `GET /api/guide/disease`

Returns the full disease-pesticide map for Wheat, Cotton, Sugarcane, Rice.

### `GET /api/guide/process`

Returns step-by-step crop process SOPs for Wheat, Cotton, Sugarcane, Rice.

---

## 18. System APIs

### `GET /health`

**Response:**
```json
{ "status": "healthy", "database": "connected" }
```

### `GET /debug-db`

**Response:**
```json
{ "status": "Pool is initialized and working" }
```

---

## Error Response Format

All errors return this format:

```json
{ "error": "Error message describing what went wrong" }
```

| HTTP Status | Meaning |
|-------------|---------|
| 200 | OK — GET/PUT/DELETE success |
| 201 | Created — POST success |
| 400 | Bad Request — invalid data |
| 404 | Not Found — route doesn't exist |
| 500 | Internal Server Error — DB or code error |
