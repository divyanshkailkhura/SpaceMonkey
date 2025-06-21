# 🚀 SpaceMonkey

**SpaceMonkey** is a full-stack, production-grade astronomy web application that lets users **observe the night sky**, **post star observations**, and **view upcoming celestial events**. It uses a modern frontend stack and integrates the **Stellarium Web Engine** for an interactive sky map experience.

---

## 🌌 Features

- 🔭 **Interactive Star Map** – Real-time sky powered by Stellarium Web Engine
- 🗣️ **Observation Posts** – Users can share what they see in the sky
- 📅 **Upcoming Celestial Events** – Planetary alignments, eclipses, meteor showers
- 💡 **Clean UI** – Responsive and mobile-first interface with dark theme

---

## 🛠 Tech Stack

| Frontend              | Backend (WIP)     | Auth / Infra        |
|-----------------------|------------------|----------------------|
| Next.js (TypeScript)  | FastAPI (Python) | JWT (planned), Docker (planned) |
| React + Tailwind CSS  | MongoDB/SQL (TBD)| Redis (optional)     |

> ⚠️ The backend implementation is currently **in progress** and will include full authentication, user management, and event APIs.

---

## 📁 Project Structure

SpaceMonkey/
├── space-frontend/ # Next.js frontend
│ ├── components/
│ ├── app/
│ └── public/
├── space-backend/ # FastAPI backend (under development)
│ ├── routes/
│ ├── models/
│ └── main.py


---

## 🔮 Roadmap

- [x] Interactive star map using Stellarium Web Engine
- [x] Event page layout and routing
- [ ] Backend APIs for event data and user posts
- [ ] Login system (JWT-based)
- [ ] Post tagging and constellation identification
- [ ] Real-time notifications and comments

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [Stellarium Web Engine](https://github.com/Stellarium/stellarium-web-engine)
- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
