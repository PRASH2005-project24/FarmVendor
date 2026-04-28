# 04 — Database Execution Flow

## MySQL — Schema, Relationships, Triggers, and Query Execution

---

## Database Overview

**Database Name:** `farmer_vendor_db`  
**Setup File:** `backend/setup_db.sql`

This database stores all persistent data for the farming management system. It contains:
- **13 tables** (core data + supporting tables)
- **3 views** (pre-built JOIN queries)
- **6 triggers** (automatic business rules)
- **4 stored procedures** (report generation with cursors)

---

## Table Schema and Relationships

### 1. `farmer` Table — Core Entity

```sql
CREATE TABLE farmer (
    farmer_id  VARCHAR(10) PRIMARY KEY,   -- e.g., "F1", "F2"
    name       VARCHAR(100) NOT NULL,
    location   VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Data:**
| farmer_id | name              | location |
|-----------|-------------------|----------|
| F1        | Mrs. Sunita Patil | Pune     |
| F2        | Mr. Ramesh Jadhav | Nashik   |

---

### 2. `land` Table — Belongs to Farmer

```sql
CREATE TABLE land (
    land_id   VARCHAR(10) PRIMARY KEY,   -- e.g., "L1"
    area      VARCHAR(50) NOT NULL,       -- e.g., "2 Acres"
    location  VARCHAR(100),
    soil_type VARCHAR(50),                -- e.g., "Black Soil"
    farmer_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmer(farmer_id) ON DELETE CASCADE
);
```

**Relationship:** Each land belongs to one farmer. `ON DELETE CASCADE` means if a farmer is deleted, their land records are also deleted automatically.

---

### 3. `crop` Table — Standalone

```sql
CREATE TABLE crop (
    crop_id   VARCHAR(10) PRIMARY KEY,   -- e.g., "C1"
    crop_name VARCHAR(100) NOT NULL,     -- e.g., "Tomato"
    season    VARCHAR(50) NOT NULL,      -- e.g., "Kharif"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Data:** Tomato (C1), Potato (C2), Cabbage (C3), Onion (C4), Brinjal (C5), Sugarcane (C6)

---

### 4. `product` Table — Standalone

```sql
CREATE TABLE product (
    product_id   VARCHAR(10) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Represents goods sold in the market (often matches crop names).

---

### 5. `sales` Table — References Product

```sql
CREATE TABLE sales (
    sale_id     VARCHAR(10) PRIMARY KEY,
    sale_date   DATE NOT NULL,
    product_id  VARCHAR(10) NOT NULL,
    quantity_Kg DECIMAL(10,2) NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);
```

**Business Rule:** When a sale is inserted, the `trg_log_sale_insert` trigger automatically writes to `audit_log`.

---

### 6. `expense` Table — References Land

```sql
CREATE TABLE expense (
    expense_id   VARCHAR(10) PRIMARY KEY,
    type         VARCHAR(100) NOT NULL,    -- e.g., "Fertilizer", "Labor"
    amount       DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    expense_date DATE,
    land_id      VARCHAR(10) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (land_id) REFERENCES land(land_id) ON DELETE CASCADE
);
```

**Constraint:** `CHECK (amount > 0)` — MySQL enforces positive amounts.  
**Trigger:** `trg_validate_expense_amount` — also validates at trigger level.

---

### 7. `activity` Table — References Crop and Land

```sql
CREATE TABLE activity (
    activity_id   VARCHAR(10) PRIMARY KEY,
    crop_id       VARCHAR(10) NOT NULL,
    land_id       VARCHAR(10),             -- Optional
    chemical_name VARCHAR(100) NOT NULL,
    quantity      VARCHAR(50) NOT NULL,
    activity_date DATE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crop(crop_id) ON DELETE CASCADE
);
```

Tracks pesticide/chemical applications. `trg_log_activity_insert` trigger logs to `audit_log`.

---

### 8. `harvest` Table — References Crop

```sql
CREATE TABLE harvest (
    harvest_id   VARCHAR(10) PRIMARY KEY,
    crop_id      VARCHAR(10) NOT NULL,
    yield_amount VARCHAR(50) NOT NULL,     -- e.g., "500 kg"
    total_cost   DECIMAL(12,2) DEFAULT 0, -- Total farming cost
    profit       DECIMAL(10,2),           -- Profit from this harvest
    harvest_date DATE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crop(crop_id) ON DELETE CASCADE
);
```

**Triggers active on this table:**
- `trg_set_default_harvest_date` — sets `harvest_date = CURDATE()` if NULL
- `trg_prevent_negative_profit` — rejects records where profit < 0

---

### 9. `audit_log` Table — Auto-populated by Triggers

```sql
CREATE TABLE audit_log (
    log_id     INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    action     VARCHAR(20) NOT NULL,      -- e.g., "INSERT"
    record_id  VARCHAR(10),
    details    TEXT,
    log_time   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

This table is **never written directly** by Flask. Only triggers write to it.

---

### 10. `fertilizer_dosage` Table — References Crop

```sql
CREATE TABLE fertilizer_dosage (
    dosage_id         VARCHAR(10) PRIMARY KEY,
    crop_id           VARCHAR(10) NOT NULL,
    fertilizer_name   VARCHAR(100) NOT NULL,
    quantity          VARCHAR(50) NOT NULL,
    application_stage VARCHAR(100),         -- e.g., "At planting"
    notes             TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crop(crop_id) ON DELETE CASCADE
);
```

---

### 11. `notification` Table — References Crop (nullable)

```sql
CREATE TABLE notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,  -- Note: INT, not VARCHAR
    crop_id         VARCHAR(10),
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    notify_date     DATE NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crop(crop_id) ON DELETE SET NULL
);
```

**Special behaviour:** `ON DELETE SET NULL` — if a crop is deleted, `crop_id` becomes NULL (notification stays).

---

### 12. `soil_report` Table — References Land

```sql
CREATE TABLE soil_report (
    report_id      VARCHAR(10) PRIMARY KEY,
    land_id        VARCHAR(10) NOT NULL,
    ph_level       DECIMAL(4,2),         -- e.g., 6.80
    nitrogen       DECIMAL(8,2),         -- kg/hectare
    phosphorus     DECIMAL(8,2),
    potassium      DECIMAL(8,2),
    organic_carbon DECIMAL(5,2),         -- percentage
    report_date    DATE,
    notes          TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (land_id) REFERENCES land(land_id) ON DELETE CASCADE
);
```

---

### 13. `exporter` Table — Standalone

```sql
CREATE TABLE exporter (
    exporter_id   VARCHAR(10) PRIMARY KEY,
    exporter_name VARCHAR(150) NOT NULL,
    exporter_type VARCHAR(50),            -- "Factory", "Trader", "Cooperative"
    crop_product  VARCHAR(100),
    current_rate  DECIMAL(10,2),
    rate_unit     VARCHAR(20) DEFAULT 'per quintal',
    location      VARCHAR(150),
    distance_km   DECIMAL(6,1),
    contact       VARCHAR(50),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Entity-Relationship Diagram (Text)

```
farmer (F1, F2...)
  │
  │ 1:N (one farmer has many lands)
  ▼
land (L1, L2...)
  │         │
  │ 1:N     │ 1:N
  ▼         ▼
expense   soil_report
(E1...)   (SR1...)


crop (C1, C2...)
  │          │         │          │
  │ 1:N      │ 1:N     │ 1:N      │ 1:N
  ▼          ▼         ▼          ▼
harvest    activity  fertilizer  notification
(H1...)    (A1...)   _dosage     (auto-int)
                     (FD1...)


product (P1, P2...)
  │
  │ 1:N
  ▼
sales (S1, S2...)


audit_log ← [auto-inserted by triggers]

exporter   ← [standalone, no FK]
```

---

## Foreign Key Cascade Rules

| Table       | FK Column   | References  | On Delete  |
|-------------|-------------|-------------|------------|
| land        | farmer_id   | farmer      | CASCADE    |
| expense     | land_id     | land        | CASCADE    |
| soil_report | land_id     | land        | CASCADE    |
| activity    | crop_id     | crop        | CASCADE    |
| harvest     | crop_id     | crop        | CASCADE    |
| fertilizer_dosage | crop_id | crop      | CASCADE    |
| notification | crop_id   | crop        | SET NULL   |
| sales       | product_id  | product     | CASCADE    |

**What CASCADE means:** If you delete `farmer F1`, all their lands (`L1`) are deleted. Then all expenses (`E1`, `E2`) and soil reports linked to `L1` are also deleted. Automatic chain reaction.

---

## Database Views (Pre-built JOINs)

### View 1: `farmer_summary_view`

```sql
CREATE VIEW farmer_summary_view AS
SELECT
    f.farmer_id, f.name, f.location,
    COUNT(DISTINCT l.land_id) AS total_lands,
    COALESCE(SUM(e.amount), 0) AS total_expenses
FROM farmer f
LEFT JOIN land l ON f.farmer_id = l.farmer_id
LEFT JOIN expense e ON l.land_id = e.land_id
GROUP BY f.farmer_id, f.name, f.location;
```

**Usage:** Query this view to see each farmer's total land count and total expenses without writing the JOIN every time.

### View 2: `sales_report_view`

```sql
CREATE VIEW sales_report_view AS
SELECT
    s.sale_id, s.sale_date, p.product_name,
    s.quantity_Kg, s.price,
    (s.quantity_Kg * s.price) AS total_amount
FROM sales s
JOIN product p ON s.product_id = p.product_id;
```

**Usage:** Automatically calculates `total_amount = quantity × price`.

### View 3: `expense_report_view`

```sql
CREATE VIEW expense_report_view AS
SELECT
    e.expense_id, e.type, e.amount, e.expense_date,
    l.land_id, l.area AS land_area,
    f.farmer_id, f.name AS farmer_name
FROM expense e
JOIN land l ON e.land_id = l.land_id
JOIN farmer f ON l.farmer_id = f.farmer_id;
```

---

## Triggers — Automatic Business Rules

Triggers fire **automatically** when data changes — no code needed in Flask.

### Trigger 1: `trg_validate_expense_amount` (BEFORE INSERT on expense)

```sql
CREATE TRIGGER trg_validate_expense_amount
BEFORE INSERT ON expense
FOR EACH ROW
BEGIN
    IF NEW.amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Expense amount must be greater than zero';
    END IF;
END;
```

**What it does:** If Flask tries to insert an expense with amount ≤ 0, MySQL throws an error and the INSERT is rejected.

---

### Trigger 2: `trg_set_default_harvest_date` (BEFORE INSERT on harvest)

```sql
CREATE TRIGGER trg_set_default_harvest_date
BEFORE INSERT ON harvest
FOR EACH ROW
BEGIN
    IF NEW.harvest_date IS NULL THEN
        SET NEW.harvest_date = CURDATE();
    END IF;
END;
```

**What it does:** If the user doesn't provide a harvest date, MySQL automatically sets it to today's date.

---

### Trigger 3: `trg_log_sale_insert` (AFTER INSERT on sales)

```sql
CREATE TRIGGER trg_log_sale_insert
AFTER INSERT ON sales
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, record_id, details)
    VALUES ('sales', 'INSERT', NEW.sale_id,
        CONCAT('Product: ', NEW.product_id, ', Qty: ', NEW.quantity_Kg, ' kg, Price: Rs.', NEW.price));
END;
```

**What it does:** Every new sale is automatically recorded in `audit_log`. Example log entry:
```
table: sales | action: INSERT | record: S11 | details: Product: P1, Qty: 5 kg, Price: Rs.120
```

---

### Trigger 4: `trg_prevent_negative_profit` (BEFORE INSERT on harvest)

```sql
CREATE TRIGGER trg_prevent_negative_profit
BEFORE INSERT ON harvest
FOR EACH ROW
BEGIN
    IF NEW.profit IS NOT NULL AND NEW.profit < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Harvest profit cannot be negative';
    END IF;
END;
```

---

### Trigger 5: `trg_log_activity_insert` (AFTER INSERT on activity)

```sql
CREATE TRIGGER trg_log_activity_insert
AFTER INSERT ON activity
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, record_id, details)
    VALUES ('activity', 'INSERT', NEW.activity_id,
        CONCAT('Crop: ', NEW.crop_id, ', Chemical: ', NEW.chemical_name, ', Qty: ', NEW.quantity));
END;
```

---

### Trigger 6: `trg_set_default_activity_date` (BEFORE INSERT on activity)

```sql
CREATE TRIGGER trg_set_default_activity_date
BEFORE INSERT ON activity
FOR EACH ROW
BEGIN
    IF NEW.activity_date IS NULL THEN
        SET NEW.activity_date = CURDATE();
    END IF;
END;
```

---

## Trigger Execution Timeline (Sale INSERT example)

```
Flask: cursor.execute("INSERT INTO sales VALUES (S11, ...)")
                      ↓
MySQL receives the INSERT statement
                      ↓
BEFORE INSERT triggers check (none for sales)
                      ↓
Row is written to the sales table
                      ↓
AFTER INSERT trigger fires: trg_log_sale_insert
                      ↓
INSERT INTO audit_log (...) executes automatically
                      ↓
conn.commit() is called by Flask
                      ↓
Both the sale and the audit log entry are permanently saved
```

---

## Stored Procedures with Cursors

### What is a Cursor?

A cursor is like a pointer that moves through query results **one row at a time**. It's used when you need to do processing on each row individually.

### Procedure 1: `sp_farmer_summary`

```sql
CREATE PROCEDURE sp_farmer_summary()
BEGIN
    DECLARE farmer_cursor CURSOR FOR SELECT farmer_id, name, location FROM farmer;
    
    -- Loop through each farmer
    LOOP
        FETCH farmer_cursor INTO v_farmer_id, v_name, v_location;
        
        -- For each farmer: count their lands
        SELECT COUNT(*) INTO v_land_count FROM land WHERE farmer_id = v_farmer_id;
        
        -- For each farmer: sum their expenses
        SELECT COALESCE(SUM(e.amount), 0) INTO v_total_expense
        FROM expense e JOIN land l ON e.land_id = l.land_id
        WHERE l.farmer_id = v_farmer_id;
        
        INSERT INTO tmp_farmer_summary VALUES (...);
    END LOOP;
    
    SELECT * FROM tmp_farmer_summary;  -- Return results
END;
```

**Flask calls it as:**
```python
cursor.callproc('sp_farmer_summary')
for result in cursor.stored_results():
    rows = result.fetchall()
```

---

## How Queries Are Executed and Results Returned

### Step-by-step for a JOIN query

```
Flask builds query:
  SELECT s.*, p.product_name
  FROM sales s
  LEFT JOIN product p ON s.product_id = p.product_id
  ORDER BY s.created_at DESC
          ↓
cursor.execute(query) sends to MySQL
          ↓
MySQL Query Optimizer plans execution:
  1. Scan sales table
  2. For each row, find matching product via product_id index
          ↓
MySQL executes the JOIN
          ↓
Returns result set (rows with merged columns)
          ↓
cursor.fetchall() loads all rows into Python memory
          ↓
Flask iterates rows, converts Decimal/date to JSON-safe types:
  r['quantity_Kg'] = float(r['quantity_Kg'])
  r['sale_date'] = str(r['sale_date'])
          ↓
jsonify(rows) converts Python list of dicts to JSON string
          ↓
HTTP Response: 200 OK + JSON body
```
