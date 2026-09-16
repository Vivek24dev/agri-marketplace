# 📂 File Manifest - SIH Agri-Marketplace

```
agri-marketplace/
├── .gitignore
├── README.md
├── COMPLETE_README.md
├── QUICK_START.md
├── BUILD_SUMMARY.md
├── FILE_MANIFEST.md
├── TECHNICAL_SPEC.md
├── database_schema.sql
│
├── backend/
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   ├── database_schema.sql
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── fpo.js
│   │   ├── prices.js
│   │   └── admin.js
│   ├── scripts/
│   │   └── seedPrices.js
│   ├── uploads/
│   │   └── .gitkeep
│   └── data/
│       └── database.json
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── styles/
        │   └── App.css
        ├── store/
        │   └── authStore.js
        ├── utils/
        │   ├── api.js
        │   ├── cvGrading.js
        │   └── helpers.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── PostCard.jsx
        │   ├── FPOCard.jsx
        │   ├── CVUpload.jsx
        │   └── PriceDisplay.jsx
        └── pages/
            ├── Login.jsx
            ├── Signup.jsx
            ├── FarmerDashboard.jsx
            ├── BuyerDashboard.jsx
            └── AdminDashboard.jsx
```
