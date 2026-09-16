# ⚡ Quick Start Guide - SIH Agri-Marketplace

Follow these steps to run the complete stack locally:

## Prerequisites
- Node.js v16+ (Node v18, v20, v24 fully supported)
- npm v8+
- Modern Web Browser (Chrome, Edge, Firefox, Safari)

---

## 1. Backend Setup
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Verify environment configuration in `.env`:
   ```env
   PORT=5000
   JWT_SECRET=agri_marketplace_super_secret_jwt_key_2026_sih
   ADMIN_EMAIL=vivek24307@gmail.com
   ADMIN_PASSWORD=12345678a
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/agri_marketplace
   ```
3. Start the server:
   ```bash
   npm start
   ```
   > **Note:** If PostgreSQL is running on your machine, it will automatically connect. If not, it will seamlessly start in zero-configuration mode with persistent storage in `backend/data/database.json`.

---

## 2. Frontend Setup
1. Open a second terminal in `frontend/`:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 3. Instant Testing Flows
- **Test as Farmer:**
  1. Click "Farmer Demo" on the login page.
  2. In the "Buyer Requirements" tab, use the form on the left to upload produce, view the AI grading analysis (Grade A, Blemish 95%, etc.), and post it.
  3. Browse buyer demands and click "Connect on WhatsApp" to initiate negotiation.
  4. In the "FPO Aggregation" tab, join a Tomato bulk pool or launch a new one.
  5. In "My Posts", click "Dealing Done" to complete a deal.
- **Test as Buyer:**
  1. Logout and click "Buyer Demo".
  2. Browse farmer produce with CV grade badges.
  3. Submit a new requirement on the right.
- **Test as Admin:**
  1. Logout and click "Admin".
  2. View live analytics cards, ratio progress bars, user directories, and update APMC mandi benchmarks.
