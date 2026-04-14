-- ============================================
-- Farmer Vendor Management System
-- Database Setup Script
-- ============================================

CREATE DATABASE IF NOT EXISTS farmer_vendor_db;
USE farmer_vendor_db;

-- Drop tables in correct order (foreign key dependencies)
DROP TABLE IF EXISTS harvest;
DROP TABLE IF EXISTS expense;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS crop;
DROP TABLE IF EXISTS land;
DROP TABLE IF EXISTS farmer;

-- ============================================
-- 1. Farmer Table
-- ============================================
CREATE TABLE farmer (
    farmer_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. Land Table (FK: farmer_id)
-- ============================================
CREATE TABLE land (
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
CREATE TABLE crop (
    crop_id VARCHAR(10) PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    season VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. Product Table
-- ============================================
CREATE TABLE product (
    product_id VARCHAR(10) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. Sales Table (FK: product_id)
-- ============================================
CREATE TABLE sales (
    sale_id VARCHAR(10) PRIMARY KEY,
    sale_date DATE NOT NULL,
    product_id VARCHAR(10) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

-- ============================================
-- 6. Expense Table (FK: land_id)
-- ============================================
CREATE TABLE expense (
    expense_id VARCHAR(10) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE,
    land_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (land_id) REFERENCES land(land_id) ON DELETE CASCADE
);

-- ============================================
-- 7. Harvest Table (FK: crop_id)
-- ============================================
CREATE TABLE harvest (
    harvest_id VARCHAR(10) PRIMARY KEY,
    crop_id VARCHAR(10) NOT NULL,
    yield_amount VARCHAR(50) NOT NULL,
    profit DECIMAL(10,2),
    harvest_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crop(crop_id) ON DELETE CASCADE
);

-- ============================================
-- Sample Data (from Case Study)
-- ============================================

-- Farmers
INSERT INTO farmer VALUES ('F1', 'Mrs. Sunita Patil', 'Pune', NOW());
INSERT INTO farmer VALUES ('F2', 'Mr. Ramesh Jadhav', 'Nashik', NOW());

-- Land
INSERT INTO land VALUES ('L1', '2 Acres', 'Pune Rural', 'F1', NOW());
INSERT INTO land VALUES ('L2', '3 Acres', 'Nashik Farm', 'F2', NOW());

-- Crops
INSERT INTO crop VALUES ('C1', 'Tomato', 'Kharif', NOW());
INSERT INTO crop VALUES ('C2', 'Potato', 'Rabi', NOW());
INSERT INTO crop VALUES ('C3', 'Cabbage', 'Rabi', NOW());

-- Products
INSERT INTO product VALUES ('P1', 'Tomato', NOW());
INSERT INTO product VALUES ('P2', 'Potato', NOW());
INSERT INTO product VALUES ('P3', 'Cabbage', NOW());

-- Sales
INSERT INTO sales VALUES ('S1', '2026-05-07', 'P1', 1, 100.00, NOW());
INSERT INTO sales VALUES ('S2', '2026-05-07', 'P2', 1, 80.00, NOW());
INSERT INTO sales VALUES ('S3', '2026-05-07', 'P3', 1, 60.00, NOW());
INSERT INTO sales VALUES ('S4', '2026-05-08', 'P1', 2, 110.00, NOW());
INSERT INTO sales VALUES ('S5', '2026-05-08', 'P2', 1, 85.00, NOW());

-- Expenses
INSERT INTO expense VALUES ('E1', 'Fertilizer', 2000.00, '2026-04-01', 'L1', NOW());
INSERT INTO expense VALUES ('E2', 'Seeds', 1000.00, '2026-04-05', 'L1', NOW());
INSERT INTO expense VALUES ('E3', 'Labor', 1500.00, '2026-04-10', 'L2', NOW());

-- Harvests
INSERT INTO harvest VALUES ('H1', 'C1', '500 kg', 8000.00, '2026-05-01', NOW());
INSERT INTO harvest VALUES ('H2', 'C2', '400 kg', 6000.00, '2026-05-15', NOW());
