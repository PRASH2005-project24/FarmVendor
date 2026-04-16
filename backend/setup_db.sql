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
-- 7. Harvest Table (FK: crop_id)
-- ============================================
CREATE TABLE IF NOT EXISTS harvest (
    harvest_id VARCHAR(10) PRIMARY KEY,
    crop_id VARCHAR(10) NOT NULL,
    yield_amount VARCHAR(50) NOT NULL,
    profit DECIMAL(10,2),
    harvest_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crop(crop_id) ON DELETE CASCADE
);

-- ============================================
-- 8. Audit Log Table (for Triggers)
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
-- Sample Data (from Case Study)
-- ============================================

-- Farmers
INSERT IGNORE INTO farmer VALUES ('F1', 'Mrs. Sunita Patil', 'Pune', NOW());
INSERT IGNORE INTO farmer VALUES ('F2', 'Mr. Ramesh Jadhav', 'Nashik', NOW());

-- Land
INSERT IGNORE INTO land VALUES ('L1', '2 Acres', 'Pune Rural', 'F1', NOW());
INSERT IGNORE INTO land VALUES ('L2', '3 Acres', 'Nashik Farm', 'F2', NOW());

-- Crops
INSERT IGNORE INTO crop VALUES ('C1', 'Tomato', 'Kharif', NOW());
INSERT IGNORE INTO crop VALUES ('C2', 'Potato', 'Rabi', NOW());
INSERT IGNORE INTO crop VALUES ('C3', 'Cabbage', 'Rabi', NOW());

-- Products
INSERT IGNORE INTO product VALUES ('P1', 'Tomato', NOW());
INSERT IGNORE INTO product VALUES ('P2', 'Potato', NOW());
INSERT IGNORE INTO product VALUES ('P3', 'Cabbage', NOW());

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

-- Insert sample data AFTER triggers are created
-- Sales (trigger trg_log_sale_insert will log these)
INSERT IGNORE INTO sales VALUES ('S1', '2026-05-07', 'P1', 1, 100.00, NOW());
INSERT IGNORE INTO sales VALUES ('S2', '2026-05-07', 'P2', 1, 80.00, NOW());
INSERT IGNORE INTO sales VALUES ('S3', '2026-05-07', 'P3', 1, 60.00, NOW());
INSERT IGNORE INTO sales VALUES ('S4', '2026-05-08', 'P1', 2, 110.00, NOW());
INSERT IGNORE INTO sales VALUES ('S5', '2026-05-08', 'P2', 1, 85.00, NOW());

-- Expenses (trigger trg_validate_expense_amount will validate)
INSERT IGNORE INTO expense VALUES ('E1', 'Fertilizer', 2000.00, '2026-04-01', 'L1', NOW());
INSERT IGNORE INTO expense VALUES ('E2', 'Seeds', 1000.00, '2026-04-05', 'L1', NOW());
INSERT IGNORE INTO expense VALUES ('E3', 'Labor', 1500.00, '2026-04-10', 'L2', NOW());

-- Harvests (triggers will set default date and validate profit)
INSERT IGNORE INTO harvest VALUES ('H1', 'C1', '500 kg', 8000.00, '2026-05-01', NOW());
INSERT IGNORE INTO harvest VALUES ('H2', 'C2', '400 kg', 6000.00, '2026-05-15', NOW());

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

