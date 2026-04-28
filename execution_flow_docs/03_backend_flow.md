# 03 — Backend Execution Flow

## Python Flask — How the API Server Works

---

## Application Startup

**File:** `backend/app.py`

When you run `python app.py`, the following happens in order:

### Step 1: Load Environment Variables

```python
from dotenv import load_dotenv
load_dotenv()  # Reads backend/.env file
```

The `.env` file contains:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=farmer_vendor_db
```

### Step 2: Configure the Flask App

```python
static_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
app = Flask(__name__, static_folder=static_folder, static_url_path='')
CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173', '*'])
```

- Flask is told where to find the React production build (`frontend/dist/`)
- CORS is enabled so the React dev server (port 5173) can call the Flask API (port 5000)

### Step 3: Create the Database Connection Pool

```python
db_config = {
  'host': os.environ.get('DB_HOST', 'localhost'),
  'port': int(os.environ.get('DB_PORT', 3306)),
  'user': os.environ.get('DB_USER', 'root'),
  'password': os.environ.get('DB_PASSWORD', ''),
  'database': os.environ.get('DB_NAME', 'farmer_vendor_db'),
}

pool = pooling.MySQLConnectionPool(
    pool_name="farmer_pool",
    pool_size=5,           # Keeps 5 connections ready
    pool_reset_session=True,
    **db_config
)
```

A **connection pool** means Flask doesn't open/close a new database connection for every request. Instead, it reuses a pool of 5 connections, which is much faster.

### Step 4: App Starts Listening

```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=debug)
```

Flask starts listening at `http://0.0.0.0:5000` — ready to receive HTTP requests.

---

## How Flask Handles a Request

Every incoming HTTP request goes through this lifecycle:

```
HTTP Request arrives at Flask
         ↓
Flask URL dispatcher matches route:
  e.g., "GET /api/farmers" matches handle_farmers()
         ↓
Function is called
         ↓
get_db() borrows a connection from the pool
         ↓
cursor = conn.cursor(dictionary=True)
  [dictionary=True means rows come back as dicts, not tuples]
         ↓
SQL query is built and executed
         ↓
Results are fetched and processed
         ↓
cursor.close(); conn.close()  [connection returned to pool]
         ↓
jsonify(data) returns JSON response
         ↓
HTTP Response sent back to client
```

---

## Helper Functions

### `get_db()` — Get a Database Connection

```python
def get_db():
    if pool is None:
        raise Exception("Database pool is not initialized")
    return pool.get_connection()
```

Called at the start of every route handler. Returns a ready-to-use MySQL connection.

### `gen_id(prefix, table)` — Generate Unique IDs

```python
def gen_id(prefix, table):
    """Generate next ID like F3, P4, S6 etc."""
    conn = get_db()
    cursor = conn.cursor()
    id_col = {
        'farmer': 'farmer_id', 'land': 'land_id', 'crop': 'crop_id',
        ...
    }[table]
    cursor.execute(f"SELECT {id_col} FROM {table}")
    rows = cursor.fetchall()
    # Find highest number in existing IDs
    max_num = max(int(''.join(filter(str.isdigit, r[0]))) for r in rows if r[0]) or 0
    return f"{prefix}{max_num + 1}"  # e.g., "F3", "L5", "S12"
```

Example: If the `farmer` table has `F1`, `F2` → `gen_id('F', 'farmer')` returns `F3`.

### `get_sort_clause(table, default, prefix)` — Safe Dynamic Sorting

```python
ALLOWED_SORT = {
    'farmer': ['name', 'location', 'farmer_id', 'created_at'],
    ...
}

def get_sort_clause(table, default='created_at', prefix=''):
    sort_by = request.args.get('sort_by', default)
    order   = request.args.get('order', 'desc').upper()
    # Only allow whitelisted columns — prevents SQL injection
    if sort_by not in ALLOWED_SORT.get(table, []):
        sort_by = default
    col = f"{prefix}.{sort_by}" if prefix else sort_by
    return f" ORDER BY {col} {order}"
```

Prevents SQL injection by validating the `sort_by` column name against a whitelist.

---

## Route Handlers — Mapping Endpoints to Functions

### Pattern: One handler, two methods (GET + POST)

```python
@app.route('/api/farmers', methods=['GET', 'POST'])
def handle_farmers():
    if request.method == 'POST':
        # INSERT a new farmer
    else:
        # SELECT all farmers
```

### Pattern: One handler for specific ID (PUT + DELETE)

```python
@app.route('/api/farmers/<farmer_id>', methods=['PUT', 'DELETE'])
def modify_farmer(farmer_id):
    if request.method == 'DELETE':
        # DELETE farmer where farmer_id = ?
    else:
        # UPDATE farmer set name = ?, location = ? where farmer_id = ?
```

---

## Complete Route → Function Mapping

| HTTP Method | Endpoint                          | Function                    | SQL Operation          |
|-------------|-----------------------------------|-----------------------------|------------------------|
| GET         | `/api/farmers`                    | `handle_farmers()`          | SELECT from farmer     |
| POST        | `/api/farmers`                    | `handle_farmers()`          | INSERT into farmer     |
| PUT         | `/api/farmers/<id>`               | `modify_farmer()`           | UPDATE farmer          |
| DELETE      | `/api/farmers/<id>`               | `modify_farmer()`           | DELETE from farmer     |
| GET         | `/api/land`                       | `handle_land()`             | SELECT land JOIN farmer|
| POST        | `/api/land`                       | `handle_land()`             | INSERT into land       |
| PUT         | `/api/land/<id>`                  | `modify_land()`             | UPDATE land            |
| DELETE      | `/api/land/<id>`                  | `modify_land()`             | DELETE from land       |
| GET         | `/api/crops`                      | `handle_crops()`            | SELECT from crop       |
| POST        | `/api/crops`                      | `handle_crops()`            | INSERT into crop       |
| GET         | `/api/products`                   | `handle_products()`         | SELECT from product    |
| POST        | `/api/products`                   | `handle_products()`         | INSERT into product    |
| GET         | `/api/sales`                      | `handle_sales()`            | SELECT sales JOIN product |
| POST        | `/api/sales`                      | `handle_sales()`            | INSERT into sales      |
| GET         | `/api/expenses`                   | `handle_expenses()`         | SELECT expense JOIN land JOIN farmer |
| POST        | `/api/expenses`                   | `handle_expenses()`         | INSERT into expense    |
| GET         | `/api/activities`                 | `handle_activities()`       | SELECT activity JOIN crop JOIN land |
| POST        | `/api/activities`                 | `handle_activities()`       | INSERT into activity   |
| GET         | `/api/harvests`                   | `handle_harvests()`         | SELECT harvest JOIN crop |
| POST        | `/api/harvests`                   | `handle_harvests()`         | INSERT into harvest    |
| GET         | `/api/fertilizer-dosages`         | `handle_fertilizer_dosages()` | SELECT fertilizer_dosage JOIN crop |
| POST        | `/api/fertilizer-dosages`         | `handle_fertilizer_dosages()` | INSERT into fertilizer_dosage |
| GET         | `/api/exporters`                  | `handle_exporters()`        | SELECT from exporter   |
| POST        | `/api/exporters`                  | `handle_exporters()`        | INSERT into exporter   |
| GET         | `/api/soil-reports`               | `handle_soil_reports()`     | SELECT soil_report JOIN land JOIN farmer |
| POST        | `/api/soil-reports`               | `handle_soil_reports()`     | INSERT into soil_report |
| GET         | `/api/notifications`              | `handle_notifications()`   | SELECT notification JOIN crop |
| POST        | `/api/notifications`              | `handle_notifications()`   | INSERT into notification |
| PUT         | `/api/notifications/<id>/read`    | `mark_notification_read()` | UPDATE notification SET is_read=TRUE |
| DELETE      | `/api/notifications/<id>`         | `delete_notification()`    | DELETE from notification |
| GET         | `/api/notifications/unread-count` | `unread_notification_count()` | COUNT where is_read=FALSE |
| GET         | `/api/dashboard`                  | `dashboard()`               | Multiple COUNT/SUM queries |
| GET         | `/api/reports/farmer-summary`     | `report_farmer_summary()`   | CALL sp_farmer_summary() |
| GET         | `/api/reports/monthly-sales`      | `report_monthly_sales()`    | CALL sp_monthly_sales_report() |
| GET         | `/api/reports/revenue-by-product` | `report_revenue_by_product()` | CALL sp_revenue_by_product() |
| GET         | `/api/reports/expense-by-land`    | `report_expense_by_land()` | CALL sp_expense_by_land() |
| GET         | `/api/audit-log`                  | `get_audit_log()`           | SELECT from audit_log  |
| GET         | `/api/suggestions/crops-by-soil`  | `suggest_crops_by_soil()`  | Python dict lookup (no SQL) |
| GET         | `/api/suggestions/fertility`      | `suggest_fertility()`       | Python dict lookup (no SQL) |
| GET         | `/api/recommendations`            | `data_recommendations()`    | AVG/SUM query on harvest + crop |
| GET         | `/api/smart-suggestions/<id>`     | `farmer_smart_suggestions()` | Multi-step SQL + Python logic |
| GET         | `/api/guide/disease`              | `get_disease_guide()`       | Returns DISEASE_PESTICIDE_MAP dict |
| GET         | `/api/guide/process`              | `get_process_guide()`       | Returns CROP_PROCESS_SOP dict |
| GET         | `/health`                         | `health()`                  | SELECT 1 (DB ping)    |
| GET         | `/debug-db`                       | `debug_db()`                | Pool status check     |

---

## Detailed Flow: POST /api/farmers

```python
@app.route('/api/farmers', methods=['GET', 'POST'])
def handle_farmers():
    try:
        conn = get_db()                          # Step 1: Get DB connection
        cursor = conn.cursor(dictionary=True)    # Step 2: Dictionary cursor

        if request.method == 'POST':
            data = request.json                  # Step 3: Parse JSON body
            fid = gen_id('F', 'farmer')          # Step 4: Generate next ID (e.g., "F3")
            cursor.execute(
                "INSERT INTO farmer (farmer_id, name, location) VALUES (%s, %s, %s)",
                (fid, data['name'], data.get('location', ''))
            )                                    # Step 5: Execute INSERT
            conn.commit()                        # Step 6: Save to database
            cursor.close()
            conn.close()                         # Step 7: Release connection
            return jsonify({"id": fid, "message": "Farmer added"}), 201
            # Step 8: Return 201 Created with new ID
```

**Note:** `%s` placeholders are used (not string concatenation) to prevent SQL injection.

---

## Detailed Flow: GET /api/farmers (with filters)

```python
else:  # GET request
    query = "SELECT * FROM farmer"
    params = []
    
    location = request.args.get('location')  # ?location=Pune
    if location:
        query += " WHERE location LIKE %s"
        params.append(f"%{location}%")       # LIKE '%Pune%'
    
    query += get_sort_clause('farmer')       # ORDER BY created_at DESC
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    for r in rows:
        r['created_at'] = str(r['created_at'])  # Convert datetime to string
    
    return jsonify(rows), 200
```

---

## Business Logic — Smart Suggestion Engine

**Route:** `GET /api/smart-suggestions/<farmer_id>`

This is the most complex route. It combines SQL queries with Python logic:

```python
def farmer_smart_suggestions(farmer_id):
    # Step 1: Find all soil types for this farmer's lands
    cursor.execute(
        "SELECT soil_type FROM land WHERE farmer_id = %s AND soil_type IS NOT NULL",
        (farmer_id,)
    )
    soil_types = [l['soil_type'] for l in cursor.fetchall()]

    # Step 2: Find most profitable crops from historical harvest data
    cursor.execute("""
        SELECT c.crop_name,
               SUM(h.total_cost) as total_cost,
               SUM(h.profit) as total_profit,
               (SUM(h.profit) / NULLIF(SUM(h.total_cost), 1)) * 100 as roi_percentage
        FROM harvest h
        JOIN crop c ON h.crop_id = c.crop_id
        GROUP BY c.crop_name
        ORDER BY roi_percentage DESC
    """)
    profitable_crops = cursor.fetchall()

    # Step 3: Match profitable crops with soil-suitable crops
    soil = soil_types[0]
    suitable_crops = SOIL_CROP_MAP.get(soil, [])  # Python dict lookup

    for pc in profitable_crops:
        if pc['crop_name'] in suitable_crops:  # Best profitable + suitable match
            best_match = pc
            break

    # Step 4: Return recommendation with ROI explanation
    return jsonify({
        "farmer_id": farmer_id,
        "recommended_crop": best_match['crop_name'],
        "basis": f"Based on your {soil}, {crop} yields {roi:.1f}% ROI..."
    })
```

---

## Stored Procedure Calls

For the Reports page, Flask calls MySQL stored procedures (not raw SQL):

```python
@app.route('/api/reports/farmer-summary')
def report_farmer_summary():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.callproc('sp_farmer_summary')   # Calls MySQL stored procedure
    rows = []
    for result in cursor.stored_results():  # Collects all result sets
        rows = result.fetchall()
    return jsonify(rows), 200
```

`cursor.stored_results()` is used because stored procedures return results differently from regular queries.

---

## Error Handling

Every route is wrapped in `try/except`:

```python
try:
    ...business logic...
except Exception as e:
    logger.error(f"Error: {e}")            # Log the error
    return jsonify({"error": str(e)}), 500 # Return 500 to client
```

Flask also has global error handlers:

```python
@app.errorhandler(404)
def not_found(e):
    if not request.path.startswith('/api/'):
        # Serve React's index.html for client-side routes (e.g., /dashboard)
        return send_from_directory(static_folder, 'index.html')
    return jsonify({"error": "Route not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500
```

This means if someone directly visits `http://your-site/farmers`, Flask serves React's `index.html` and React Router handles the route.

---

## In-Memory Data (No Database)

Some routes return data from Python dictionaries — **no SQL needed**:

```python
SOIL_CROP_MAP = {
    'Black Soil': ['Cotton', 'Sugarcane', 'Wheat', ...],
    'Alluvial Soil': ['Rice', 'Wheat', 'Sugarcane', ...],
    ...
}

DISEASE_PESTICIDE_MAP = {
    'Wheat': {
        'Rust': {'chemical': 'Propiconazole 25% EC', 'organic': 'Neem oil'},
        ...
    },
    ...
}

CROP_PROCESS_SOP = {
    'Wheat': [
        {'step': 1, 'title': 'Land Preparation', 'desc': '...'},
        ...
    ],
    ...
}
```

These are served from:
- `GET /api/suggestions/crops-by-soil?soil_type=Black Soil`
- `GET /api/guide/disease`
- `GET /api/guide/process`
