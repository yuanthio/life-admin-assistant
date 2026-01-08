# 🧠 Life Admin Assistant — Personal Administration Reminder App

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404d59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge)](https://ui.shadcn.com/)

**Life Admin Assistant** is a full-stack web application designed to help users manage and track everyday administrative obligations such as utility bills, subscriptions, and vehicle taxes. The application combines structured task management, predefined templates, and **AI-powered deadline suggestions** to ensure users never miss important due dates.

---

## ✨ Key Features

- 🗓️ **Administrative Deadline Tracking**  
  Track recurring obligations such as electricity (PLN), water (PDAM), internet bills, and vehicle tax.

- 🧾 **Predefined Templates**  
  Ready-to-use templates for common administrative tasks to speed up data entry.

- 🤖 **AI-Based Reminder Suggestions**  
  Smart suggestions and notifications when deadlines are approaching.

- 🔐 **Authentication & User Management**  
  Secure authentication using Supabase.

- 🎨 **Modern & Responsive UI**  
  Clean, accessible interface built with Tailwind CSS and shadcn/ui.

- ⚙️ **Clean Full-Stack Architecture**  
  Clear separation between frontend and backend for maintainability and scalability.

---

## 🛠️ Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- Express.js
- PostgreSQL
- Supabase (Authentication & Database)

---

## 📂 Project Structure

    ```text
    life-admin-assistant/
    ├── backend/                    # Express.js backend API
    │   ├── src/                    # Backend source code
    │   └── package.json            # Backend dependencies & scripts
    ├── frontend/                   # Next.js frontend application
    │   ├── app/                    # Next.js App Router
    │   ├── components/             # Reusable UI components
    │   ├── lib/                    # Utilities & helpers
    │   ├── styles/                 # Global styles & Tailwind config
    │   ├── public/                 # Static assets
    │   └── package.json            # Frontend dependencies & scripts
    ├── .gitignore
    └── README.md

## 🚀 Getting Started
1. Clone Repository
   ```bash
   git clone https://github.com/yuanthio/life-admin-assistant.git
   cd life-admin-assistant
2. Install Dependencies
   Frontend & Backend:
   ```bash
   npm install
3. Environment Variables
   Create environment files:
   Frontend (frontend/.env.local) & Backend (backend/.env)
   ```bash
   ## .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ## .env
   DATABASE_URL=postgresql://user:password@localhost:5432/life_admin
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
4. Run Development Servers
   Backend & Frontend:
   ```bash
   npm run dev

# 🎯 Project Goals
Life Admin Assistant is built to demonstrate:
- Clean and maintainable full-stack architecture
- Real-world administrative problem solving
- AI-assisted productivity features
- Modern UI/UX using Tailwind CSS and shadcn/ui
   
