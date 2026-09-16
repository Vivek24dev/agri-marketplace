# 🏗️ Technical Specification - SIH Agri-Marketplace

This file preserves the official architecture and technical specification used to build the KisanSetu platform.

## Database Design
- `users`: id, name, email, password, user_type, district, phone, whatsapp_number, profile_image_url, is_verified, created_at, updated_at
- `posts`: id, user_id, title, description, category, crop_type, quantity, price_per_unit, grade, image_url, user_type, is_active, created_at, updated_at
- `fpo`: id, creator_id, crop_type, required_quantity, current_quantity, grade, location, district, price, is_active, created_at, updated_at
- `fpo_joins`: id, fpo_id, farmer_id, quantity_contributed, created_at
- `mandi_prices`: id, crop_type, district, price, min_price, max_price, market_name, updated_at (unique crop_type, district)
- `cv_grades`: id, post_id, grade, blemish_score, color_score, size_score, overall_score, image_hash, created_at

## Endpoints
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/posts`
- `GET /api/posts`
- `GET /api/posts/user/:userId`
- `POST /api/posts/:postId/dealing-done`
- `POST /api/fpo`
- `GET /api/fpo`
- `POST /api/fpo/:fpoId/join`
- `GET /api/fpo/:fpoId`
- `POST /api/fpo/:fpoId/complete`
- `GET /api/prices`
- `GET /api/crops`
- `GET /api/districts`
- `POST /api/admin/login`
- `GET /api/admin/users`
- `GET /api/admin/analytics`
- `POST /api/admin/prices/update`
