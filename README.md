# 🌾 Agro-Market - SIH Agri-Marketplace & FPO Aggregation Platform

> **Smart India Hackathon (SIH) Technical Deliverable**  
> Direct Farmer-to-Buyer Agricultural Marketplace with Computer Vision Produce Quality Grading, FPO Bulk Volume Aggregation, and Real-Time Mandi Price Benchmarks.

---

## 🚀 Key Features

1. **Direct Marketplace Feeds:**
   - **Farmers** view active wholesale buyer requirements and connect directly via WhatsApp.
   - **Buyers** explore verified produce listings with photo quality badges and negotiate with zero middlemen.
2. **Automated Computer Vision (CV) Grading:**
   - Produce photos undergo edge quality assessment analyzing blemish purity, color ripeness, and size uniformity to award verifiable Grade A, B, or C badges.
3. **FPO Bulk Aggregation:**
   - Smallholders pool small harvest volumes into cooperative bulk clusters with interactive progress bar tracking towards transportation pickups.
4. **Real-time Mandi Benchmarks:**
   - 35+ regional APMC market rates across Karnataka districts with automated scheduled price fluctuations.
5. **Role-Based Admin Console:**
   - Platform analytics, user directory, deal conversion tracking, and live mandi price update manager.
6. **Zero-Friction Dual-Mode Database Engine:**
   - Full PostgreSQL 12+ relational DDL (`database_schema.sql`) with seamless zero-config embedded persistence fallback so anyone can launch immediately with zero setup errors.

---

## 📦 Quick Start

### 1. Launch Backend API (Port 5000)
```bash
cd backend
npm install
npm start
```

### 2. Launch Frontend UI (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:3000`** in your browser!

### 🔑 Demo Accounts (1-Click Login buttons on Login screen)
- **Farmer Demo:** `farmer@example.com` / `password123`
- **Buyer Demo:** `buyer@example.com` / `password123`
- **Administrator:** `vivek24307@gmail.com` / `12345678a`
