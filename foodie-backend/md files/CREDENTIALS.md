# 🔐 Test Account Credentials

Use these accounts to log in and test the application features. All accounts are generated via the `config/seed.js` script.

## 👤 User Accounts
**Default Password**: `password123` (for all accounts)

| Username | Email | Role | Bio Snippet |
| :--- | :--- | :--- | :--- |
| **alexfoods** | `alex@example.com` | User | Food critic, 500+ reviews |
| **priyaeats** | `priya@example.com` | User | Street food lover |
| **marcusbites** | `marcus@example.com` | User | From ramen to ravioli |
| **sofiaplates** | `sofia@example.com` | User | Vegetarian foodie |
| **jordanwok** | `jordan@example.com` | User | Asian cuisine explorer |
| **admin** | `admin@foodie.com` | Admin | System Administrator |

---

## 🏠 Seeded Restaurants
These restaurants are available for reviews and searching.

- **Sakura Ramen House** (Japanese) - Downtown
- **The Spice Route** (Indian) - Midtown
- **Bella Napoli** (Italian) - Soho
- **Seoul Kitchen** (Korean) - Koreatown

---

## 📊 Database Details
- **Database Name**: `foodie_db`
- **Connection Details**: Available in `.env`
- **Seeding Command**: `node config/seed.js` (Run this to reset/populate data)
