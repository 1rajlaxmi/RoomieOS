# RoomieOS 🏠

A sleek, full-stack web application designed for roommates to manage shared metrics, log chores in real-time, and split expenses cleanly.

▶️ **[Explore the Live Application](https://roomie-os-ptez.vercel.app)**

---

## 🚀 Key Features

* **Secure Authentication:** Implements robust cookie-based session tracking utilizing JWT tokens.
* **Real-time Synchronization:** Built-in WebSocket cluster layer for instant, live dashboard updates across roommate profiles.
* **Smart Rate Limiting:** High-security middleware filters deployed on authentication routes to mitigate brute-force attempts.
* **Responsive Architecture:** A responsive client-side layout built with React Router to transition smoothly from desktop to mobile screens.

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, React Router, Axios |
| **Backend** | Node.js, Express, WebSockets (`socket.io`), Express Rate Limit |
| **Database** | MongoDB Atlas (Mongoose ORM) |
| **Hosting** | Vercel (Frontend Site), Render (Backend API Web Service) |

## 📦 Local Installation & Setup

Want to run RoomieOS locally? Follow these quick steps:

### 1. Clone the Repository
```bash
git clone [[https://github.com/YOUR_GITHUB_USERNAME/RoomieOS.git](https://github.com/YOUR_GITHUB_USERNAME/RoomieOS.git)](https://github.com/1rajlaxmi/RoomieOS/tree/main)
cd RoomieOS
