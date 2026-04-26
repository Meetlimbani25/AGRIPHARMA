# AgriPharma Frontend

React frontend for the AgriPharma smart farming platform.

## Project Structure

```
src/
├── assets/
│   └── styles/
│       └── global.css          # Global theme, variables, utilities
├── components/
│   ├── Navbar.jsx / .css       # Sticky navigation bar
│   ├── Footer.jsx / .css       # Site footer
│   └── ProtectedRoute.jsx      # Auth guard for private routes
├── context/
│   └── AuthContext.js          # Global auth state (farmer / shopkeeper)
├── pages/
│   ├── Home.jsx / .css         # Landing page with farm animations
│   ├── Login.jsx               # Login (farmer + shopkeeper tabs)
│   ├── Register.jsx            # Signup (farmer + shopkeeper)
│   ├── Auth.css                # Shared auth page styles (animated bg)
│   ├── Dashboard.jsx / .css    # Post-login dashboard
│   ├── Crops.jsx / .css        # Crop listing with season filter
│   ├── CropDetail.jsx / .css   # Crop detail + weekly schedule + seeds
│   ├── Shop.jsx / .css         # Products / Seeds / Shopkeeper tabs
│   ├── Disease.jsx / .css      # AI disease detection + history
│   ├── Cart.jsx / .css         # Cart management + order placement
│   ├── Orders.jsx / .css       # Order history + detail view
│   ├── Profile.jsx / .css      # View / edit profile
│   └── Shopkeeper.jsx / .css   # Shopkeeper portal
└── services/
    └── api.js                  # All Axios API calls mapped to backend routes
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit REACT_APP_API_URL to point to your backend

# 3. Start dev server
npm start
```

## Backend Routes Used

| Feature           | Endpoint                        |
|-------------------|---------------------------------|
| Farmer Register   | POST /api/auth/register         |
| Farmer Login      | POST /api/auth/login            |
| Shopkeeper Reg    | POST /api/auth/shopkeeper/register |
| Shopkeeper Login  | POST /api/auth/shopkeeper/login |
| Profile           | GET/PUT /api/auth/profile       |
| Crops             | GET /api/crops                  |
| Crop Detail       | GET /api/crops/:id              |
| Products          | GET /api/shop/products          |
| Seeds             | GET /api/shop/seeds             |
| Shopkeeper Prods  | GET /api/shop/shopkeeper-products |
| Cart              | GET/POST/PUT/DELETE /api/cart   |
| Orders            | GET/POST /api/orders            |
| Disease Detect    | POST /api/disease/detect        |
| Disease History   | GET /api/disease/history        |

## Design

- **Fonts**: Playfair Display (headings) + DM Sans (body) + Space Mono (numbers)
- **Colors**: Deep green (#1a3d1a), earthy tones, gold accents
- **Animation**: CSS farm animations (tractor, clouds, crops swaying) on auth pages
- **Theme**: Organic/natural — earthy, warm, professional
