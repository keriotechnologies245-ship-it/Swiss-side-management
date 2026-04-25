# Swiss Side Management Suite

Professional inventory and facility management intelligence system designed for high-performance training centers and lodges.

## 🚀 Overview

This suite provides real-time tracking of kitchen consumables, gym equipment maintenance, room registries, and general facility supplies. Built with a focus on speed, security, and reactive synchronization.

### Key Modules:
- **Kitchen Hub:** Real-time stock tracking with automated reorder alerts.
- **Gym Center:** Equipment inventory and maintenance logging.
- **Room Registry:** Dynamic room status tracking (Ready, Cleaning, Maintenance).
- **Audit Logs:** Full history of every stock movement and system change.
- **Role-Based Access:** Strict separation between Staff (Daily Operations) and Super Admin (Configuration/Deletion).

## 🛠 Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Convex (Real-time Cloud Database & Functions)
- **Authentication:** Custom session-based auth with Bcrypt hashing and secure token rotation.
- **Infrastructure:** Render (Frontend Hosting), Resend (Transactional Email).

## ⚙️ Setup & Deployment

### Environment Variables
Create a `.env.local` in the `frontend` directory:
```env
VITE_CONVEX_URL=your_convex_deployment_url
```

In your Convex dashboard, set:
- `RESEND_API_KEY`: Your Resend API key for OTPs and password resets.

### Local Development
1. Clone the repository.
2. Run `npm install` in the `frontend` directory.
3. Start the Convex dev server: `npx convex dev`
4. Start the frontend: `npm run dev`

### Production Deployment
The system is configured for zero-downtime deployment via **Render** using the included `render.yaml` blueprint. Ensure the `VITE_CONVEX_URL` secret is configured in the Render dashboard.

## 🔒 Security Posture
- **Authentication:** Cryptographically secure session tokens generated via `crypto.randomBytes`.
- **Encryption:** All passwords stored as salted Bcrypt hashes.
- **Rate Limiting:** Brute-force protection on logins and password reset requests.
- **Audit Trail:** Every transaction is tied to a verified user identity.

---
*Developed by Roy [Your Surname]*
