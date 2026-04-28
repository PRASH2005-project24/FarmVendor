-- ============================================
-- Farmer Vendor Management System
-- Database Setup Script
-- ============================================

CREATE DATABASE IF NOT EXISTS farmer_vendor_db;
USE farmer_vendor_db;

-- Drop existing objects
DROP PROCEDURE IF EXISTS sp_farmer_summary;
DROP PROCEDURE IF EXISTS sp_monthly_sales_report;
DROP PROCEDURE IF EXISTS sp_revenue_by_product;
DROP PROCEDURE IF EXISTS sp_expense_by_land;

DROP VIEW IF EXISTS farmer_summary_view;
DROP VIEW IF EXISTS sales_report_view;
DROP VIEW IF EXISTS expense_report_view;

-- Drop tables in correct order (foreign key dependencies)
-- We use IF NOT EXISTS now to prevent wiping data on restart
-- DROP TABLE IF EXISTS audit_log;
-- DROP TABLE IF EXISTS activity;
-- DROP TABLE IF EXISTS harvest;
-- DROP TABLE IF EXISTS expense;
-- DROP TABLE IF EXISTS sales;
-- DROP TABLE IF EXISTS product;
-- DROP TABLE IF EXISTS crop;
-- DROP TABLE IF EXISTS land;
-- DROP TABLE IF EXISTS farmer;

-- ============================================
-- 1. Farmer Table
-- ============================================
CREATE TABLE IF NOT EXISTS farmer (
    farmer_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. Land Table (FK: farmer_id)
-- ============================================
CREATE TABLE IF NOT EXISTS land (
    land_id VARCHAR(10) PRIMARY KEY,
    area VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    farmer_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmer(farmer_id) ON DELETE CASCADE
);

-- ============================================
-- 3. Crop Table
-- ============================================
CREATE TABLE IF NOT EXISTS crop (
    crop_id VARCHAR(10) PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    season VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. Product Table
-- ============================================
CREATE TABLE IF NOT EXISTS product (
    product_id VARCHAR(10) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. Sales Table (FK: product_id)
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
    sale_id VARCHAR(10) PRIMARY KEY,
    sale_date DATE NOT NULL,
    product_id VARCHAR(10) NOT NULL,
    quantity_Kg DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

-- ============================================
-- 6. Expense Table (FK: land_id)
-- ============================================
CREATE TABLE IF NOT EXISTS expense (
    expense_id VARCHAR(10) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    expense_date DATE,
    land_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (land_id) REFERENCES land(land_id) ON DELETE CASCADE
);

-- ============================================
-- 7. Activity / Chemical Usage Table (FK: crop_id)
-- Tracks chemical applications, sprays, fertilizer usage
-- ============================================
CREATE TABLE IF NOT EXISTS activity (
    activity_id VARCHAR(10) PRIMARY KEY,
    crop_id VARCHAR(10) NOT NULL,
    chemical_name VARCHAR(100) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crop(crop_id) ON DELETE CASCADE
);

-- ============================================
-- 8. Harvest Table (FK: crop_id) — Enhanced with total_cost
-- ============================================
CREATE TABLE IF NOT EXISTS harvest (
    harvest_id VARCHAR(10) PRIMARY KEY,
    crop_id VARCHAR(10) NOT NULL,
    yield_amount VARCHAR(50) NOT NULL,
    total_cost DECIMAL(12,2) DEFAULT 0,
    profit DECIMAL(10,2),
    harvest_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crop(crop_id) ON DELETE CASCADE
);

-- Safely add total_cost column if upgrading from older schema
-- (ignored if column already exists from CREATE TABLE above)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'farmer_vendor_db' AND TABLE_NAME = 'harvest' AND COLUMN_NAME = 'total_cost');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE harvest ADD COLUMN total_cost DECIMAL(12,2) DEFAULT 0 AFTER yield_amount', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 9. Audit Log Table (for Triggers)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    record_id VARCHAR(10),
    details TEXT,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. Fertilizer Dosage Table (FK: crop_id)
-- Tracks recommended fertilizer quantities per crop
-- ============================================
CREATE TABLE IF NOT EXISTS fertilizer_dosage (
    dosage_id VARCHAR(10) PRIMARY KEY,
    crop_id VARCHAR(10) NOT NULL,
    fertilizer_name VARCHAR(100) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    application_stage VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crop(crop_id) ON DELETE CASCADE
);

-- ============================================
-- 11. Notification Table (FK: crop_id)
-- Smart farming reminders and alerts
-- ============================================
CREATE TABLE IF NOT EXISTS notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id VARCHAR(10),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notify_date DATE NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crop(crop_id) ON DELETE SET NULL
);

-- ============================================
-- 12. Soil Report Table (FK: land_id)
-- Stores soil test lab report values
-- ============================================
CREATE TABLE IF NOT EXISTS soil_report (
    report_id VARCHAR(10) PRIMARY KEY,
    land_id VARCHAR(10) NOT NULL,
    ph_level DECIMAL(4,2),
    nitrogen DECIMAL(8,2),
    phosphorus DECIMAL(8,2),
    potassium DECIMAL(8,2),
    organic_carbon DECIMAL(5,2),
    report_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (land_id) REFERENCES land(land_id) ON DELETE CASCADE
);

-- ============================================
-- 13. Exporter / Market Table
-- Nearby factories, traders, buyers with rates
-- ============================================
CREATE TABLE IF NOT EXISTS exporter (
    exporter_id VARCHAR(10) PRIMARY KEY,
    exporter_name VARCHAR(150) NOT NULL,
    exporter_type VARCHAR(50),
    crop_product VARCHAR(100),
    current_rate DECIMAL(10,2),
    rate_unit VARCHAR(20) DEFAULT 'per quintal',
    location VARCHAR(150),
    distance_km DECIMAL(6,1),
    contact VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safely add soil_type column to land table
SET @col_exists2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'farmer_vendor_db' AND TABLE_NAME = 'land' AND COLUMN_NAME = 'soil_type');
SET @sql2 = IF(@col_exists2 = 0, 'ALTER TABLE land ADD COLUMN soil_type VARCHAR(50) DEFAULT NULL AFTER location', 'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Safely add land_id column to activity table
SET @col_exists3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'farmer_vendor_db' AND TABLE_NAME = 'activity' AND COLUMN_NAME = 'land_id');
SET @sql3 = IF(@col_exists3 = 0, 'ALTER TABLE activity ADD COLUMN land_id VARCHAR(10) DEFAULT NULL AFTER crop_id', 'SELECT 1');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- ============================================
-- Sample Data (from Case Study)
-- ============================================

-- Farmers
INSERT IGNORE INTO farmer VALUES ('F1', 'Mrs. Sunita Patil', 'Pune', NOW());
INSERT IGNORE INTO farmer VALUES ('F2', 'Mr. Ramesh Jadhav', 'Nashik', NOW());

-- Land
INSERT IGNORE INTO land (land_id, area, location, farmer_id) VALUES ('L1', '2 Acres', 'Pune Rural', 'F1');
INSERT IGNORE INTO land (land_id, area, location, farmer_id) VALUES ('L2', '3 Acres', 'Nashik Farm', 'F2');

-- Crops
INSERT IGNORE INTO crop VALUES ('C1', 'Tomato', 'Kharif', NOW());
INSERT IGNORE INTO crop VALUES ('C2', 'Potato', 'Rabi', NOW());
INSERT IGNORE INTO crop VALUES ('C3', 'Cabbage', 'Rabi', NOW());
INSERT IGNORE INTO crop VALUES ('C4', 'Onion', 'Kharif', NOW());
INSERT IGNORE INTO crop VALUES ('C5', 'Brinjal', 'Kharif', NOW());

-- Products (original + field visit data)
INSERT IGNORE INTO product VALUES ('P1', 'Tomato', NOW());
INSERT IGNORE INTO product VALUES ('P2', 'Potato', NOW());
INSERT IGNORE INTO product VALUES ('P3', 'Cabbage', NOW());
INSERT IGNORE INTO product VALUES ('P4', 'Bhendi', NOW());
INSERT IGNORE INTO product VALUES ('P5', 'Vangi', NOW());
INSERT IGNORE INTO product VALUES ('P6', 'Batata', NOW());
INSERT IGNORE INTO product VALUES ('P7', 'Kanda', NOW());

-- ============================================
-- TRIGGERS (Topic 8)
-- ============================================

-- Trigger 1: Validate expense amount > 0
DELIMITER //
CREATE TRIGGER trg_validate_expense_amount
BEFORE INSERT ON expense
FOR EACH ROW
BEGIN
    IF NEW.amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Expense amount must be greater than zero';
    END IF;
END //
DELIMITER ;

-- Trigger 2: Set default harvest date to today if not provided
DELIMITER //
CREATE TRIGGER trg_set_default_harvest_date
BEFORE INSERT ON harvest
FOR EACH ROW
BEGIN
    IF NEW.harvest_date IS NULL THEN
        SET NEW.harvest_date = CURDATE();
    END IF;
END //
DELIMITER ;

-- Trigger 3: Log every new sale into audit_log
DELIMITER //
CREATE TRIGGER trg_log_sale_insert
AFTER INSERT ON sales
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, record_id, details)
    VALUES ('sales', 'INSERT', NEW.sale_id,
        CONCAT('Product: ', NEW.product_id, ', Qty: ', NEW.quantity_Kg, ' kg, Price: Rs.', NEW.price));
END //
DELIMITER ;

-- Trigger 4: Prevent negative profit in harvest
DELIMITER //
CREATE TRIGGER trg_prevent_negative_profit
BEFORE INSERT ON harvest
FOR EACH ROW
BEGIN
    IF NEW.profit IS NOT NULL AND NEW.profit < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Harvest profit cannot be negative';
    END IF;
END //
DELIMITER ;

-- Trigger 5: Log every new activity into audit_log
DELIMITER //
CREATE TRIGGER trg_log_activity_insert
AFTER INSERT ON activity
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, record_id, details)
    VALUES ('activity', 'INSERT', NEW.activity_id,
        CONCAT('Crop: ', NEW.crop_id, ', Chemical: ', NEW.chemical_name, ', Qty: ', NEW.quantity));
END //
DELIMITER ;

-- Trigger 6: Set default activity date to today if not provided
DELIMITER //
CREATE TRIGGER trg_set_default_activity_date
BEFORE INSERT ON activity
FOR EACH ROW
BEGIN
    IF NEW.activity_date IS NULL THEN
        SET NEW.activity_date = CURDATE();
    END IF;
END //
DELIMITER ;

-- ============================================
-- Insert sample data AFTER triggers are created
-- ============================================

-- Sales (original + field visit vendor data)
INSERT IGNORE INTO sales VALUES ('S1', '2026-05-07', 'P1', 1, 100.00, NOW());
INSERT IGNORE INTO sales VALUES ('S2', '2026-05-07', 'P2', 1, 80.00, NOW());
INSERT IGNORE INTO sales VALUES ('S3', '2026-05-07', 'P3', 1, 60.00, NOW());
INSERT IGNORE INTO sales VALUES ('S4', '2026-05-08', 'P1', 2, 110.00, NOW());
INSERT IGNORE INTO sales VALUES ('S5', '2026-05-08', 'P2', 1, 85.00, NOW());
-- Field visit vendor/sales data
INSERT IGNORE INTO sales VALUES ('S6', '2026-04-20', 'P4', 5, 100.00, NOW());
INSERT IGNORE INTO sales VALUES ('S7', '2026-04-20', 'P5', 3, 80.00, NOW());
INSERT IGNORE INTO sales VALUES ('S8', '2026-04-20', 'P6', 4, 100.00, NOW());
INSERT IGNORE INTO sales VALUES ('S9', '2026-04-21', 'P1', 6, 120.00, NOW());
INSERT IGNORE INTO sales VALUES ('S10', '2026-04-21', 'P7', 8, 60.00, NOW());

-- Expenses (original + field visit data)
INSERT IGNORE INTO expense VALUES ('E1', 'Fertilizer', 2000.00, '2026-04-01', 'L1', NOW());
INSERT IGNORE INTO expense VALUES ('E2', 'Seeds', 1000.00, '2026-04-05', 'L1', NOW());
INSERT IGNORE INTO expense VALUES ('E3', 'Labor', 1500.00, '2026-04-10', 'L2', NOW());
-- Field visit expense data (from farmer's notebook)
INSERT IGNORE INTO expense VALUES ('E4', 'Fertilizer', 40000.00, '2026-03-15', 'L1', NOW());
INSERT IGNORE INTO expense VALUES ('E5', 'Seeds', 22030.00, '2026-03-18', 'L1', NOW());
INSERT IGNORE INTO expense VALUES ('E6', 'Pesticides', 45001.00, '2026-03-20', 'L2', NOW());
INSERT IGNORE INTO expense VALUES ('E7', 'Labour', 32841.00, '2026-03-25', 'L2', NOW());
INSERT IGNORE INTO expense VALUES ('E8', 'Transport', 9269.00, '2026-04-01', 'L1', NOW());
INSERT IGNORE INTO expense VALUES ('E9', 'Misc', 8000.00, '2026-04-02', 'L2', NOW());
INSERT IGNORE INTO expense VALUES ('E10', 'Equipment', 7000.00, '2026-04-03', 'L1', NOW());
INSERT IGNORE INTO expense VALUES ('E11', 'Maintenance', 9005.00, '2026-04-05', 'L2', NOW());
INSERT IGNORE INTO expense VALUES ('E12', 'Water Supply', 2400.00, '2026-04-07', 'L1', NOW());
INSERT IGNORE INTO expense VALUES ('E13', 'Other', 8500.00, '2026-04-08', 'L2', NOW());

-- Harvests (original + field visit production/yield data)
INSERT IGNORE INTO harvest VALUES ('H1', 'C1', '500 kg', 958000.00, 8000.00, '2026-05-01', NOW());
INSERT IGNORE INTO harvest VALUES ('H2', 'C2', '400 kg', 958000.00, 6000.00, '2026-05-15', NOW());
-- Field visit yield data (production ratios from farmer records)
INSERT IGNORE INTO harvest VALUES ('H3', 'C1', '100 kg', 239500.00, 27000.00, '2026-04-15', NOW());
INSERT IGNORE INTO harvest VALUES ('H4', 'C2', '50 kg', 119750.00, 13500.00, '2026-04-18', NOW());
INSERT IGNORE INTO harvest VALUES ('H5', 'C3', '25 kg', 59875.00, 6750.00, '2026-04-20', NOW());
INSERT IGNORE INTO harvest VALUES ('H6', 'C4', '10 kg', 23950.00, 2700.00, '2026-04-22', NOW());

-- Activity / Chemical Usage data (from field visit)
INSERT IGNORE INTO activity VALUES ('A1', 'C1', 'Phosphoric Acid', '85%', '2026-03-10', NOW());
INSERT IGNORE INTO activity VALUES ('A2', 'C1', 'Hydrogen', '3 units', '2026-03-12', NOW());
INSERT IGNORE INTO activity VALUES ('A3', 'C2', 'Phosphate', '31 units', '2026-03-15', NOW());
INSERT IGNORE INTO activity VALUES ('A4', 'C2', 'Potassium', '64 units', '2026-03-18', NOW());
INSERT IGNORE INTO activity VALUES ('A5', 'C3', 'Chemical Mix', '98 gm', '2026-03-20', NOW());
INSERT IGNORE INTO activity VALUES ('A6', 'C1', 'Chemical A', '500 gm', '2026-03-25', NOW());
INSERT IGNORE INTO activity VALUES ('A7', 'C2', 'Chemical B', '250 gm', '2026-03-28', NOW());
INSERT IGNORE INTO activity VALUES ('A8', 'C3', 'Chemical C', '250 gm', '2026-04-01', NOW());

-- Fertilizer Dosage sample data
-- Sugarcane (assuming user adds it as C6)
INSERT IGNORE INTO crop VALUES ('C6', 'Sugarcane', 'Kharif', NOW());
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD1', 'C6', '19:0:19', '1 kg', 'At planting', 'Balanced NPK for initial growth', NOW());
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD2', 'C6', 'Urea', '2 kg', 'After 30 days', 'Nitrogen boost for growth', NOW());
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD3', 'C6', 'DAP', '1.5 kg', 'At planting', 'Phosphorus for root development', NOW());
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD4', 'C6', 'MOP (Muriate of Potash)', '1 kg', 'After 60 days', 'Potassium for sugar content', NOW());
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD5', 'C6', 'Zinc Sulphate', '250 gm', 'After 45 days', 'Micronutrient supplement', NOW());

-- Tomato fertilizer dosages
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD6', 'C1', '10:26:26', '500 gm', 'At transplanting', 'Basal dose for tomato', NOW());
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD7', 'C1', 'Urea', '1 kg', 'After 25 days', 'Top dressing', NOW());
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD8', 'C1', 'Calcium Nitrate', '300 gm', 'Fruiting stage', 'Prevents blossom end rot', NOW());

-- Potato fertilizer dosages
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD9', 'C2', 'DAP', '1.5 kg', 'At planting', 'Base phosphorus dose', NOW());
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD10', 'C2', 'Urea', '1 kg', 'After 30 days', 'Nitrogen for tuber growth', NOW());
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD11', 'C2', 'MOP (Muriate of Potash)', '800 gm', 'At planting', 'Tuber quality improvement', NOW());

-- Onion fertilizer dosages
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD12', 'C4', '19:19:19', '500 gm', 'After 20 days', 'Balanced growth', NOW());
INSERT IGNORE INTO fertilizer_dosage VALUES ('FD13', 'C4', 'Sulphur', '200 gm', 'At planting', 'Improves pungency and storage', NOW());

-- Exporter / Market sample data
INSERT IGNORE INTO exporter VALUES ('EX1', 'Baramati Sugar Factory', 'Factory', 'Sugarcane', 3150.00, 'per tonne', 'Baramati, Pune', 25.0, '020-27121234', NOW());
INSERT IGNORE INTO exporter VALUES ('EX2', 'Kopargaon Sugar Cooperative', 'Cooperative', 'Sugarcane', 3200.00, 'per tonne', 'Kopargaon, Ahmednagar', 85.5, '02423-222345', NOW());
INSERT IGNORE INTO exporter VALUES ('EX3', 'Nashik Onion Traders Assoc.', 'Trader', 'Onion', 2500.00, 'per quintal', 'Lasalgaon, Nashik', 45.0, '02550-240123', NOW());
INSERT IGNORE INTO exporter VALUES ('EX4', 'Pune APMC Vegetable Market', 'Market', 'Vegetables', 0.00, 'per kg', 'Market Yard, Pune', 10.0, '020-24261234', NOW());
INSERT IGNORE INTO exporter VALUES ('EX5', 'Kolhapur Gur Factory', 'Factory', 'Sugarcane', 3100.00, 'per tonne', 'Kolhapur', 120.0, '0231-2651234', NOW());

-- Soil Report sample data
INSERT IGNORE INTO soil_report VALUES ('SR1', 'L1', 6.80, 280.00, 22.50, 180.00, 0.65, '2026-03-01', 'Soil test from Krishi Vigyan Kendra', NOW());
INSERT IGNORE INTO soil_report VALUES ('SR2', 'L2', 7.20, 210.00, 18.00, 220.00, 0.52, '2026-03-10', 'Annual soil health checkup', NOW());

-- Smart Notification sample data
INSERT IGNORE INTO notification (crop_id, title, message, notify_date) VALUES ('C1', '💧 Water Your Tomatoes', 'Your tomato crop needs watering. Apply 2-3 liters per plant.', '2026-04-25');
INSERT IGNORE INTO notification (crop_id, title, message, notify_date) VALUES ('C6', '🌿 Apply Urea to Sugarcane', 'Time to apply Urea (2 kg) to your sugarcane crop for nitrogen boost.', '2026-04-28');
INSERT IGNORE INTO notification (crop_id, title, message, notify_date) VALUES ('C2', '🥔 Earthing Up - Potato', 'Your potato crop needs earthing up. Hill the soil around the stems.', '2026-04-30');
INSERT IGNORE INTO notification (crop_id, title, message, notify_date) VALUES ('C4', '💧 Irrigate Onion Field', 'Onion needs light irrigation every 7-10 days. Check soil moisture.', '2026-05-02');

-- ============================================
-- VIEWS (Topic 5 - JOIN Operations and Views)
-- ============================================

-- View 1: Farmer Summary (JOIN farmer + land + expense)
CREATE VIEW farmer_summary_view AS
SELECT
    f.farmer_id, f.name, f.location,
    COUNT(DISTINCT l.land_id) AS total_lands,
    COALESCE(SUM(e.amount), 0) AS total_expenses
FROM farmer f
LEFT JOIN land l ON f.farmer_id = l.farmer_id
LEFT JOIN expense e ON l.land_id = e.land_id
GROUP BY f.farmer_id, f.name, f.location;

-- View 2: Sales Report (JOIN sales + product)
CREATE VIEW sales_report_view AS
SELECT
    s.sale_id, s.sale_date, p.product_name, p.product_id,
    s.quantity_Kg, s.price,
    (s.quantity_Kg * s.price) AS total_amount
FROM sales s
JOIN product p ON s.product_id = p.product_id;

-- View 3: Expense Report (JOIN expense + land + farmer)
CREATE VIEW expense_report_view AS
SELECT
    e.expense_id, e.type, e.amount, e.expense_date,
    l.land_id, l.area AS land_area, l.location AS land_location,
    f.farmer_id, f.name AS farmer_name
FROM expense e
JOIN land l ON e.land_id = l.land_id
JOIN farmer f ON l.farmer_id = f.farmer_id;

-- ============================================
-- STORED PROCEDURES WITH CURSORS (Topic 7)
-- ============================================

-- Procedure 1: Farmer Summary using Cursor
DELIMITER //
CREATE PROCEDURE sp_farmer_summary()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_farmer_id VARCHAR(10);
    DECLARE v_name VARCHAR(100);
    DECLARE v_location VARCHAR(100);
    DECLARE v_land_count INT;
    DECLARE v_total_expense DECIMAL(12,2);
    DECLARE v_total_profit DECIMAL(12,2);

    DECLARE farmer_cursor CURSOR FOR SELECT farmer_id, name, location FROM farmer;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DROP TEMPORARY TABLE IF EXISTS tmp_farmer_summary;
    CREATE TEMPORARY TABLE tmp_farmer_summary (
        farmer_id VARCHAR(10),
        farmer_name VARCHAR(100),
        location VARCHAR(100),
        land_count INT,
        total_expense DECIMAL(12,2),
        total_harvest_profit DECIMAL(12,2)
    );

    OPEN farmer_cursor;
    read_loop: LOOP
        FETCH farmer_cursor INTO v_farmer_id, v_name, v_location;
        IF done THEN LEAVE read_loop; END IF;

        SELECT COUNT(*) INTO v_land_count FROM land WHERE farmer_id = v_farmer_id;

        SELECT COALESCE(SUM(e.amount), 0) INTO v_total_expense
        FROM expense e JOIN land l ON e.land_id = l.land_id
        WHERE l.farmer_id = v_farmer_id;

        SELECT COALESCE(SUM(h.profit), 0) INTO v_total_profit
        FROM harvest h JOIN crop c ON h.crop_id = c.crop_id;

        INSERT INTO tmp_farmer_summary VALUES (v_farmer_id, v_name, v_location, v_land_count, v_total_expense, v_total_profit);
    END LOOP;
    CLOSE farmer_cursor;

    SELECT * FROM tmp_farmer_summary;
    DROP TEMPORARY TABLE IF EXISTS tmp_farmer_summary;
END //
DELIMITER ;

-- Procedure 2: Monthly Sales Report using Cursor
DELIMITER //
CREATE PROCEDURE sp_monthly_sales_report()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_month VARCHAR(7);
    DECLARE v_total_qty DECIMAL(12,2);
    DECLARE v_total_revenue DECIMAL(12,2);
    DECLARE v_sale_count INT;

    DECLARE month_cursor CURSOR FOR
        SELECT DATE_FORMAT(sale_date, '%Y-%m') AS sale_month
        FROM sales GROUP BY sale_month ORDER BY sale_month;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DROP TEMPORARY TABLE IF EXISTS tmp_monthly_sales;
    CREATE TEMPORARY TABLE tmp_monthly_sales (
        sale_month VARCHAR(7),
        total_sales INT,
        total_quantity_kg DECIMAL(12,2),
        total_revenue DECIMAL(12,2)
    );

    OPEN month_cursor;
    read_loop: LOOP
        FETCH month_cursor INTO v_month;
        IF done THEN LEAVE read_loop; END IF;

        SELECT COUNT(*), COALESCE(SUM(quantity_Kg), 0), COALESCE(SUM(quantity_Kg * price), 0)
        INTO v_sale_count, v_total_qty, v_total_revenue
        FROM sales WHERE DATE_FORMAT(sale_date, '%Y-%m') = v_month;

        INSERT INTO tmp_monthly_sales VALUES (v_month, v_sale_count, v_total_qty, v_total_revenue);
    END LOOP;
    CLOSE month_cursor;

    SELECT * FROM tmp_monthly_sales;
    DROP TEMPORARY TABLE IF EXISTS tmp_monthly_sales;
END //
DELIMITER ;

-- Procedure 3: Revenue by Product using Cursor
DELIMITER //
CREATE PROCEDURE sp_revenue_by_product()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_product_id VARCHAR(10);
    DECLARE v_product_name VARCHAR(100);
    DECLARE v_total_qty DECIMAL(12,2);
    DECLARE v_total_revenue DECIMAL(12,2);
    DECLARE v_sale_count INT;

    DECLARE product_cursor CURSOR FOR SELECT product_id, product_name FROM product;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DROP TEMPORARY TABLE IF EXISTS tmp_revenue_by_product;
    CREATE TEMPORARY TABLE tmp_revenue_by_product (
        product_id VARCHAR(10),
        product_name VARCHAR(100),
        total_sales INT,
        total_quantity_kg DECIMAL(12,2),
        total_revenue DECIMAL(12,2)
    );

    OPEN product_cursor;
    read_loop: LOOP
        FETCH product_cursor INTO v_product_id, v_product_name;
        IF done THEN LEAVE read_loop; END IF;

        SELECT COUNT(*), COALESCE(SUM(quantity_Kg), 0), COALESCE(SUM(quantity_Kg * price), 0)
        INTO v_sale_count, v_total_qty, v_total_revenue
        FROM sales WHERE product_id = v_product_id;

        INSERT INTO tmp_revenue_by_product VALUES (v_product_id, v_product_name, v_sale_count, v_total_qty, v_total_revenue);
    END LOOP;
    CLOSE product_cursor;

    SELECT * FROM tmp_revenue_by_product;
    DROP TEMPORARY TABLE IF EXISTS tmp_revenue_by_product;
END //
DELIMITER ;

-- Procedure 4: Expense by Land using Cursor
DELIMITER //
CREATE PROCEDURE sp_expense_by_land()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_land_id VARCHAR(10);
    DECLARE v_area VARCHAR(50);
    DECLARE v_location VARCHAR(100);
    DECLARE v_farmer_name VARCHAR(100);
    DECLARE v_total_expense DECIMAL(12,2);
    DECLARE v_expense_count INT;

    DECLARE land_cursor CURSOR FOR
        SELECT l.land_id, l.area, l.location, f.name
        FROM land l JOIN farmer f ON l.farmer_id = f.farmer_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DROP TEMPORARY TABLE IF EXISTS tmp_expense_by_land;
    CREATE TEMPORARY TABLE tmp_expense_by_land (
        land_id VARCHAR(10),
        area VARCHAR(50),
        location VARCHAR(100),
        farmer_name VARCHAR(100),
        expense_count INT,
        total_expense DECIMAL(12,2)
    );

    OPEN land_cursor;
    read_loop: LOOP
        FETCH land_cursor INTO v_land_id, v_area, v_location, v_farmer_name;
        IF done THEN LEAVE read_loop; END IF;

        SELECT COUNT(*), COALESCE(SUM(amount), 0)
        INTO v_expense_count, v_total_expense
        FROM expense WHERE land_id = v_land_id;

        INSERT INTO tmp_expense_by_land VALUES (v_land_id, v_area, v_location, v_farmer_name, v_expense_count, v_total_expense);
    END LOOP;
    CLOSE land_cursor;

    SELECT * FROM tmp_expense_by_land;
    DROP TEMPORARY TABLE IF EXISTS tmp_expense_by_land;
END //
DELIMITER ;
