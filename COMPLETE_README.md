# 🌾 Agro-Market - Complete System Documentation

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ Farmer       │ Buyer        │ Admin                │    │
│  │ Dashboard    │ Dashboard    │ Dashboard            │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
│         │              │                    │               │
│  ┌──────┴──────┬───────┴───────┬─────────────┴──────┐     │
│  │ Auth Store  │ API Service   │ Components         │     │
│  │ (Zustand)   │ (Axios)       │ (Reusable)         │     │
│  └──────┬──────┴───────┬───────┴─────────────┬──────┘     │
└─────────┼──────────────┼────────────────────┼────────────┘
          │              │                    │
          └──────────────┼────────────────────┘
                         │
                    HTTP/REST
                         │
          ┌──────────────┼────────────────────┐
          │              │                    │
┌─────────▼──────────────▼──────────────────▼────────────────┐
│                   BACKEND (Node.js/Express)                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                  Express Server                      │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │  Auth Routes        (/api/auth/*)           │   │ │
│  │  │  Post Routes        (/api/posts/*)          │   │ │
│  │  │  FPO Routes         (/api/fpo/*)            │   │ │
│  │  │  Price Routes       (/api/prices/*)         │   │ │
│  │  │  Admin Routes       (/api/admin/*)          │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────┘ │
│         │                    │              │              │
│         ▼                    ▼              ▼              │
│  ┌────────────┐  ┌──────────────────┐  ┌────────────┐   │
│  │ File       │  │ Database Utils   │  │ Cron Jobs  │   │
│  │ Upload     │  │ (Query builder)  │  │ (Scheduler)│   │
│  │ (Multer)   │  │                  │  │            │   │
│  └────────────┘  └──────────────────┘  └────────────┘   │
└─────────┬──────────────────┬────────────────────────────┘
          │                  │
          ▼                  ▼
    ┌─────────────┐   ┌──────────────────┐
    │  File       │   │ PostgreSQL       │
    │  Storage    │   │ Database         │
    │  (uploads/) │   │                  │
    └─────────────┘   │ ┌──────────────┐ │
                      │ │ users        │ │
                      │ │ posts        │ │
                      │ │ fpo          │ │
                      │ │ fpo_joins    │ │
                      │ │ mandi_prices │ │
                      │ └──────────────┘ │
                      └──────────────────┘
```

## User Flows

### 1. Farmer Produce Flow with Computer Vision
1. Farmer logs into Agro-Market using email/password or 1-click Demo.
2. Navigates to **Buyer Requirements** tab.
3. Fills in produce details (Crop: Tomato, Qty: 50kg, Price: ₹25/kg) and attaches produce photo.
4. Computer Vision engine performs quality inference, analyzing blemish score, color ripeness, and sizing standard, awarding a verifiable **Grade A** badge.
5. Clicks "Publish Produce Post" -> instantly listed across the marketplace.
6. When negotiations conclude, farmer clicks "Dealing Done", securely completing the transaction.

### 2. Buyer Procurement & Direct Negotiation
1. Buyer opens the **Farmer Listings** tab and filters by crop type.
2. Examines produce photos, verified CV grade badges, farm locations, and volume availability.
3. Clicks **Connect on WhatsApp** to launch instant chat with pre-filled order details:
   `https://wa.me/{farmerPhone}?text=Hello...`
4. Post requirement orders for bulk crops to receive offers directly from farm clusters.

### 3. FPO Cooperative Aggregation
1. Smallholder farmers unable to supply large institutional orders pool their crops into a single **FPO Cluster**.
2. An interactive progress bar updates live as multiple farmers contribute (e.g. 50kg + 75kg + 75kg = 200kg).
3. Once 100% volume target is reached, the FPO displays a "Target Reached - Ready for Transporter Pickup" status.
4. Bulk transporters pick up from clustered pickup points with high logistical efficiency.
