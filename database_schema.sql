-- =========================================================
-- COMPLETE DATABASE SCHEMA - SIH Agri-Marketplace
-- PostgreSQL 12+ Compatible
-- =========================================================

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS cv_grades CASCADE;
DROP TABLE IF EXISTS fpo_joins CASCADE;
DROP TABLE IF EXISTS fpo CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS mandi_prices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- bcrypt hashed
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('farmer', 'buyer', 'admin')),
    district VARCHAR(100),
    phone VARCHAR(20),
    whatsapp_number VARCHAR(20),
    profile_image_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. POSTS TABLE (Social Feed)
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL CHECK (category IN ('produce', 'requirement')),
    crop_type VARCHAR(100),
    quantity DECIMAL(10, 2),  -- in kg
    price_per_unit DECIMAL(10, 2),  -- in Rs
    grade VARCHAR(50),  -- 'A', 'B', 'C' (from CV)
    image_url TEXT,  -- base64 encoded or URL
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('farmer', 'buyer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_active ON posts(is_active);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_crop ON posts(crop_type);

-- 3. FPO TABLE (Farmer Producer Organization)
CREATE TABLE fpo (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_type VARCHAR(100) NOT NULL,
    required_quantity DECIMAL(10, 2) NOT NULL,  -- kg target
    current_quantity DECIMAL(10, 2) DEFAULT 0,  -- kg collected so far
    grade VARCHAR(50),  -- 'A', 'B', 'C'
    location VARCHAR(255),
    district VARCHAR(100),
    price DECIMAL(10, 2),  -- expected price per kg
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fpo_creator ON fpo(creator_id);
CREATE INDEX idx_fpo_district ON fpo(district);
CREATE INDEX idx_fpo_active ON fpo(is_active);

-- 4. FPO_JOINS TABLE
CREATE TABLE fpo_joins (
    id SERIAL PRIMARY KEY,
    fpo_id INTEGER NOT NULL REFERENCES fpo(id) ON DELETE CASCADE,
    farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantity_contributed DECIMAL(10, 2) NOT NULL,  -- kg
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fpo_joins_fpo ON fpo_joins(fpo_id);
CREATE INDEX idx_fpo_joins_farmer ON fpo_joins(farmer_id);

-- 5. MANDI_PRICES TABLE
CREATE TABLE mandi_prices (
    id SERIAL PRIMARY KEY,
    crop_type VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,  -- current price in Rs/unit
    min_price DECIMAL(10, 2) NOT NULL,  -- minimum range
    max_price DECIMAL(10, 2) NOT NULL,  -- maximum range
    market_name VARCHAR(255),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(crop_type, district)
);

CREATE INDEX idx_mandi_crop ON mandi_prices(crop_type);
CREATE INDEX idx_mandi_district ON mandi_prices(district);

-- 6. CV_GRADES TABLE (Produce Quality Computer Vision Records)
CREATE TABLE cv_grades (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    grade VARCHAR(50),  -- 'A', 'B', 'C'
    blemish_score DECIMAL(5, 2),  -- 0-100
    color_score DECIMAL(5, 2),  -- 0-100
    size_score DECIMAL(5, 2),  -- 0-100
    overall_score DECIMAL(5, 2),  -- 0-100
    image_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================================
-- SEED DATA
-- =========================================================

-- Initial Demo Users
-- Passwords:
-- farmer@example.com -> 'password123'
-- buyer@example.com  -> 'password123'
-- vivek24307@gmail.com -> '12345678a'
INSERT INTO users (id, name, email, password, user_type, district, phone, whatsapp_number, is_verified) VALUES
(1, 'Farmer Demo', 'farmer@example.com', '$2a$10$wTqKj1m9JgX9oQO4E9F7e.iB1XU6oZ/hZ9k5.vB5I/9z8H4zN0O1a', 'farmer', 'Bengaluru', '9876543210', '9876543210', true),
(2, 'Buyer Demo', 'buyer@example.com', '$2a$10$wTqKj1m9JgX9oQO4E9F7e.iB1XU6oZ/hZ9k5.vB5I/9z8H4zN0O1a', 'buyer', 'Bengaluru', '9876543211', '9876543211', true),
(3, 'Admin', 'vivek24307@gmail.com', '$2a$10$pL1mD2vCgJ6q5gH9x0.Oe.J3OQ9j6m5b7G4z8D1k4F7g3L0p9k5sW', 'admin', 'Bengaluru', '9876543212', '9876543212', true),
(4, 'Ramesh Kumar', 'ramesh@example.com', '$2a$10$wTqKj1m9JgX9oQO4E9F7e.iB1XU6oZ/hZ9k5.vB5I/9z8H4zN0O1a', 'farmer', 'Kolar', '9988776655', '9988776655', true),
(5, 'Suresh Gowda', 'suresh@example.com', '$2a$10$wTqKj1m9JgX9oQO4E9F7e.iB1XU6oZ/hZ9k5.vB5I/9z8H4zN0O1a', 'farmer', 'Mandya', '9988112233', '9988112233', true);

SELECT setval('users_id_seq', 5, true);

-- Sample Mandi Prices (35+ entries across crops and Karnataka districts)
INSERT INTO mandi_prices (crop_type, district, price, min_price, max_price, market_name) VALUES
('Tomato', 'Bengaluru', 25.00, 20.00, 30.00, 'Yeshwantpur APMC Market'),
('Tomato', 'Belagavi', 22.00, 18.00, 28.00, 'Belagavi Central Mandi'),
('Tomato', 'Kolar', 21.00, 17.00, 26.00, 'Kolar Tomato Market Yard'),
('Tomato', 'Tumkur', 23.50, 19.00, 28.00, 'Tumkur APMC Sub-Yard'),
('Tomato', 'Mysuru', 26.00, 21.00, 31.00, 'Bandipalya APMC Mysuru'),
('Potato', 'Bengaluru', 30.00, 25.00, 35.00, 'Binny Mill Market'),
('Potato', 'Belagavi', 28.00, 24.00, 33.00, 'Belagavi Agri Hub'),
('Potato', 'Hassan', 27.50, 22.00, 32.00, 'Hassan Potato Trading Yard'),
('Potato', 'Mysuru', 29.00, 24.00, 34.00, 'Mysuru APMC Mandi'),
('Onion', 'Bengaluru', 35.00, 30.00, 42.00, 'Yeshwantpur Onion Yard'),
('Onion', 'Ballari', 31.00, 26.00, 38.00, 'Ballari Onion Market'),
('Onion', 'Raichur', 32.50, 27.00, 39.00, 'Raichur Central Mandi'),
('Carrot', 'Bengaluru', 40.00, 32.00, 48.00, 'K.R. Market Bengaluru'),
('Carrot', 'Chikmagalur', 38.00, 30.00, 45.00, 'Chikmagalur Valley Mandi'),
('Cabbage', 'Bengaluru', 18.00, 14.00, 22.00, 'Yeshwantpur Market'),
('Cabbage', 'Kolar', 15.00, 12.00, 20.00, 'Kolar APMC Yard'),
('Cucumber', 'Bengaluru', 22.00, 16.00, 28.00, 'K.R. Market'),
('Cucumber', 'Tumkur', 19.00, 15.00, 25.00, 'Tumkur Vegetable Yard'),
('Brinjal', 'Bengaluru', 28.00, 22.00, 35.00, 'Yeshwantpur Market'),
('Brinjal', 'Mandya', 24.00, 19.00, 30.00, 'Mandya Farmer Market'),
('Rice', 'Raichur', 48.00, 42.00, 56.00, 'Raichur Sona Masoori Hub'),
('Rice', 'Mandya', 45.00, 39.00, 52.00, 'Mandya Rice Market Yard'),
('Wheat', 'Belagavi', 34.00, 30.00, 40.00, 'Belagavi Grain Mandi'),
('Wheat', 'Ballari', 36.00, 31.00, 42.00, 'Ballari Grain Exchange'),
('Chilli', 'Ballari', 120.00, 100.00, 145.00, 'Byadgi Chilli Market Hub'),
('Garlic', 'Bengaluru', 160.00, 130.00, 190.00, 'Yeshwantpur Spice Yard'),
('Pepper', 'Kodagu', 450.00, 400.00, 510.00, 'Madikeri Spice Mandi'),
('Pepper', 'Chikmagalur', 440.00, 390.00, 500.00, 'Chikmagalur Planters Exchange'),
('Sugarcane', 'Mandya', 3.20, 2.80, 3.80, 'Mandya Sugar Mill Yard'),
('Coconut', 'Tumkur', 28.00, 22.00, 35.00, 'Tiptur Coconut Market Yard'),
('Coconut', 'Hassan', 26.00, 20.00, 32.00, 'Arasikere Coconut Exchange'),
('Banana', 'Mysuru', 30.00, 24.00, 38.00, 'Nanjangud Rasabale Mandi'),
('Mango', 'Kolar', 65.00, 50.00, 85.00, 'Srinivaspur Mango Yard'),
('Orange', 'Kodagu', 55.00, 45.00, 70.00, 'Coorg Orange Farmers Market'),
('Milk', 'Bengaluru', 42.00, 38.00, 46.00, 'Bengaluru Dairy Cooperative'),
('Eggs', 'Bengaluru', 5.50, 5.00, 6.20, 'Bengaluru Poultry Exchange');

-- Sample Posts
INSERT INTO posts (id, user_id, title, description, category, crop_type, quantity, price_per_unit, grade, image_url, user_type, is_active) VALUES
(1, 1, 'Fresh Premium Hybrid Tomatoes', 'Harvested this morning. Grade A quality, uniform red ripeness, firm texture, ready for dispatch.', 'produce', 'Tomato', 50.00, 25.00, 'A', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80', 'farmer', true),
(2, 4, 'Grade A Seed Potatoes', 'Crisp and clean stored potatoes, suitable for chips or wholesale supply.', 'produce', 'Potato', 120.00, 28.00, 'A', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80', 'farmer', true),
(3, 2, 'Need High Quality Tomatoes for Restaurant Chain', 'Bulk requirement for hotel kitchen supply across Bengaluru. Urgent delivery needed.', 'requirement', 'Tomato', 100.00, 24.00, 'A', NULL, 'buyer', true),
(4, 2, 'Urgent: Bulk Potatoes Required', 'Required for wholesale food processing unit. Looking for Grade A or B potatoes.', 'requirement', 'Potato', 250.00, 27.00, 'B', NULL, 'buyer', true);

SELECT setval('posts_id_seq', 4, true);

-- Sample FPO
INSERT INTO fpo (id, creator_id, crop_type, required_quantity, current_quantity, grade, location, district, price, is_active) VALUES
(1, 1, 'Tomato', 200.00, 125.00, 'A', 'Devanahalli Farm Cluster, Bengaluru Rural', 'Bengaluru', 25.00, true),
(2, 4, 'Potato', 300.00, 150.00, 'A', 'Malur Aggregation Center, Kolar', 'Kolar', 27.00, true);

SELECT setval('fpo_id_seq', 2, true);

-- Sample FPO Joins
INSERT INTO fpo_joins (id, fpo_id, farmer_id, quantity_contributed) VALUES
(1, 1, 1, 75.00),
(2, 1, 4, 50.00),
(3, 2, 4, 150.00);

SELECT setval('fpo_joins_id_seq', 3, true);
