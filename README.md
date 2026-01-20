# 🏸 Badminton Scoreboard Web App

A professional **Badminton Doubles Scoreboard** built with **React + Redux (Vite)**, designed for **outdoor night tournaments**, projector displays, and referee-controlled scoring.

This app is a modern web replacement of an Android native scoreboard app and supports **correct badminton rules**, **audio announcements**, **undo**, and **future multi-device sync**.

---

## ✨ Key Features

### 🏆 Match & Scoring Rules

* Best of **3 games to 21 points**
* **Win by 2**, cap at **30 points**
* **Automatic service rotation**
* **Third set mid-game court swap at 11 points**
* Automatic game & match progression

### 👥 Player & Court Logic

* Doubles play (2 players per team)
* Correct **left/right court rotation** (rule-accurate)
* **Serving player highlighted**, partner dimmed
* Receiver team visually distinguished
* Court orientation mirrored correctly (teams face each other)

### 🔊 Audio Announcements (Web Speech API)

* Announces score after every point
* Announces **service change with player name**
* Announces **score in server → receiver order**

Example:

> "Service over. Soumik M to serve. 4 – 6"

### ⏪ Controls & Safety

* Manual scoring buttons (+1 Left / +1 Right)
* **UNDO** (deep state restore)
* Confirmation popups for critical actions
* Button tap protection (prevents double scoring)

### ⏱️ Utilities

* Match timer (auto-start on first point)
* Live **date & time** display (projector-friendly)
* Optimized for large screens & night visibility

---

## 🧑‍💻 Tech Stack

* **React 18**
* **Redux Toolkit** (state management)
* **Vite** (build & dev server)
* **Web Speech API** (TTS announcements)

*(Firebase integration planned but not required for local use)*

---

## 📦 Project Structure

```
badminton-scoreboard/
├─ package.json
├─ index.html
├─ vite.config.js
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ index.css
│  ├─ logic/            # Scoring & rotation engine
│  ├─ redux/            # Redux store & slice
│  ├─ audio/            # TTS announcement logic
│  ├─ components/       # UI components
│  └─ pages/            # Projector & Control views
└─ README.md
```

---

## 🚀 Local Development Setup

### 1️⃣ Prerequisites

* **Node.js**: v16 or higher (v18 recommended)
* **npm**: comes with Node.js

Check versions:

```bash
node -v
npm -v
```

---

### 2️⃣ Clone the Repository

```bash
git clone <your-bitbucket-repo-url>
cd badminton-scoreboard
```

Or download ZIP and extract.

---

### 3️⃣ Install Dependencies

```bash
npm install
```

---

### 4️⃣ Start Local Development Server (IMPORTANT)

This project uses **Vite**.

✅ Correct command:

```bash
npm run dev
```

❌ Do **NOT** use:

```bash
npm start
```

---

### 5️⃣ Open in Browser

Terminal will show:

```
Local: http://localhost:5173/
```

Open the URL in your browser.

---

## 🖥️ App Views

### 🎥 Projector View

* Main scoreboard screen
* Designed for TV / projector

### 🎛️ Referee Control View

* Manual scoring buttons
* Undo & match control

If routing is enabled:

```
http://localhost:5173/control
```

---

## ✅ Verification Checklist

After loading the app, verify:

* ✔ Left & Right +1 buttons work
* ✔ Correct serving player highlighted
* ✔ Partner dimmed
* ✔ Court rotation correct
* ✔ Undo restores state
* ✔ Announcements correct
* ✔ Timer starts on first point
* ✔ Date & time visible

---

## 🛠️ Common Issues & Fixes

### ❌ `npm error Missing script: "start"`

✅ Solution:

```bash
npm run dev
```

---

### ❌ Blank screen

* Open browser DevTools (F12)
* Check Console errors
* Most common causes:

  * Import path mismatch
  * Redux state shape mismatch

---

### ❌ Port already in use

```bash
npm run dev -- --port 5174
```

---

## 🏗️ Production Build (Optional)

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

---

## 🔮 Planned Enhancements

* Firebase Authentication
* Multi-device real-time sync
* Admin / Primary / Secondary / View-only roles
* Team registration with photos
* Match scheduling & rounds
* Tournament history & audit trail

---

## 🏸 Tournament Usage Tips

* Use **Chrome fullscreen (F11)** on projector
* Disable device sleep
* Use dark/night mode for outdoor visibility
* Keep at least one backup device logged in

---

## 📅 Roadmap

* **Local stability:** ✅ Done
* **Soft launch:** January 17 (local)
* **Full release:** February tournament

---

## 📄 License

Private project — internal tournament use.

---

