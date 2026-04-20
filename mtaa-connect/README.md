# 🏘️ Mtaa Connect v2.0
### Community Platform for Slum Communities in Kenya

---

## 🚀 Quick Start (5 minutes)

### Step 1 — Get MongoDB (free)
1. Go to **[mongodb.com/atlas](https://mongodb.com/atlas)** → Create free account
2. Create a FREE cluster (M0 tier) → Create database user
3. Network Access → Add IP: `0.0.0.0/0`
4. Click **Connect** → **Connect your application** → Copy the URI

### Step 2 — Set up backend
```bash
cd backend
cp .env.example .env
```
Open `.env` and replace `YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx` with your MongoDB URI.

```bash
npm install
npm run seed    # Creates admin account + sample data
npm run dev     # Starts API on http://localhost:5000
```

### Step 3 — Set up frontend
```bash
# In a new terminal
cd frontend
npm install
npm start       # Opens http://localhost:3000
```

### Step 4 — Login as Admin
```
URL:      http://localhost:3000/login
Username: denis254
Password: denodeno254
```
You'll be redirected to the Admin Dashboard automatically.

---

## 🔐 Admin Credentials
| Field    | Value         |
|----------|---------------|
| Username | `denis254`    |
| Password | `denodeno254` |
| Phone    | `+254000000001` |
| Role     | Super Admin   |

> **Forgot password?** Run `npm run seed` again — it resets the admin password.

---

## 📁 Project Structure
```
mtaa-connect/
├── backend/
│   ├── server.js              ← Express + Socket.io server
│   ├── .env.example           ← Copy to .env
│   ├── config/
│   │   └── seed.js            ← Creates admin + sample data
│   ├── models/
│   │   ├── User.js            ← Users with geolocation + username
│   │   └── index.js           ← All other models
│   ├── routes/
│   │   ├── auth.js            ← Login (phone/username/email), register
│   │   ├── posts.js           ← Stories feed + admin moderation
│   │   ├── jobs.js            ← Job listings + applications
│   │   ├── donations.js       ← Food/donation requests
│   │   ├── reports.js         ← Community problem reports
│   │   ├── businesses.js      ← Business directory
│   │   ├── skills.js          ← Courses + enrollment
│   │   ├── safety.js          ← Confidential safety reports
│   │   ├── emergency.js       ← Emergency alerts + SMS
│   │   ├── maps.js            ← Live map data (all layers)
│   │   ├── payments.js        ← M-Pesa integration (sandbox)
│   │   ├── admin.js           ← Admin dashboard + user management
│   │   ├── messages.js        ← Private messaging
│   │   └── notifications.js   ← Push notifications
│   └── middleware/
│       └── auth.js            ← JWT + role-based guards
│
└── frontend/
    ├── .env                   ← API URL config
    ├── src/
    │   ├── App.js             ← Routes + auth guards
    │   ├── context/
    │   │   ├── AuthContext.js ← Auth state + login/register
    │   │   └── SocketContext.js ← Real-time events
    │   ├── utils/
    │   │   └── api.js         ← Axios instance
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   ├── Layout.js
    │   │   ├── EmergencyBanner.js
    │   │   └── EmergencyModal.js
    │   └── pages/
    │       ├── Home.js         ← Landing page
    │       ├── Login.js        ← Username/phone/email login
    │       ├── Register.js
    │       ├── Feed.js         ← Stories feed
    │       ├── Jobs.js         ← Job alerts + post jobs
    │       ├── Donations.js    ← Food & donation requests
    │       ├── Skills.js       ← Free skills training
    │       ├── Reports.js      ← Community problem reporting
    │       ├── Businesses.js   ← Local business directory
    │       ├── Safety.js       ← Women & child safety
    │       ├── MapPage.js      ← Live community map (Leaflet)
    │       ├── Messages.js     ← Real-time private messages
    │       ├── Profile.js      ← Profile + admin monetisation
    │       ├── AdminDashboard.js ← Full admin panel
    │       └── NotFound.js
```

---

## 💰 Monetisation Plans

| Feature | Price |
|---------|-------|
| User account | **FREE** |
| Jobs Category Admin | KSh 2,000/month |
| Business Directory Admin | KSh 3,500/month |
| Skills Training Admin | KSh 1,500/month |
| Stories/Community Admin | KSh 1,000/month |
| Donations/NGO Admin | KSh 800/month |
| Featured job listing | KSh 500/week |
| Sponsored job + SMS blast | KSh 2,000 |
| Basic business listing | KSh 500/month |
| Standard business listing | KSh 1,200/month |
| Premium business listing | KSh 2,000/month |

All payments via **M-Pesa STK Push (Lipa Na M-Pesa)**

---

## 🗺️ Map Features
- **Businesses** with category icons (food 🍗, salon 💇, tech 📱, etc.)
- **Jobs** with featured badge
- **Emergency alerts** with radius circles
- **Community reports** with upvote count
- **Live user locations** (opt-in — admin sees all users)
- **My location** with 300m radius indicator
- Layer toggles for each category

---

## ⚡ Real-time Features (Socket.io)
- Emergency alerts broadcast instantly to ALL online users
- Live location updates on the map
- New job notifications
- Post approval/rejection notifications
- Private messaging delivery
- M-Pesa payment confirmation
- Admin sees pending post alerts in real-time

---

## 🔧 Production Deployment

### Backend → Railway (free tier)
1. Push `backend/` to GitHub
2. New project on [railway.app](https://railway.app) → Deploy from GitHub
3. Add all environment variables from `.env`
4. Update `FRONTEND_URL` to your Vercel URL

### Frontend → Vercel (free tier)
1. Push `frontend/` to GitHub
2. New project on [vercel.com](https://vercel.com) → Import from GitHub
3. Set `REACT_APP_API_URL` = your Railway URL + `/api`
4. Set `REACT_APP_SOCKET_URL` = your Railway URL

### After deploying
```bash
# Update MONGO_URI callback URL for M-Pesa
MPESA_CALLBACK_URL=https://your-railway-url.up.railway.app/api/payments/mpesa/callback
```

---

## 🐛 Troubleshooting

**"Login failed"**
- Make sure backend is running on port 5000
- Run `npm run seed` to create the admin account
- Check MongoDB connection in `.env`

**"Cannot connect to server"**
- Ensure `REACT_APP_API_URL=http://localhost:5000/api` in `frontend/.env`
- Check that backend is running

**Admin panel not accessible**
- Login with username `denis254` and password `denodeno254`
- If it still fails, run `cd backend && npm run seed` to reset

**Map not loading**
- Leaflet CSS is imported via `index.css` — ensure `leaflet` is installed
- Run `cd frontend && npm install`

---

## 📱 Next Steps
- [ ] Cloudinary image upload for posts and business photos
- [ ] Africa's Talking SMS for emergency alerts (add AT_API_KEY to .env)
- [ ] Real M-Pesa integration (replace sandbox keys in .env)
- [ ] Firebase Cloud Messaging for push notifications
- [ ] Progressive Web App (PWA) for offline support
- [ ] Swahili language support
- [ ] USSD support for feature phones
