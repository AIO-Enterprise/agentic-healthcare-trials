# MarketingAI — AI-Powered Marketing Analytics Platform

An end-to-end marketing automation platform that uses AI (Claude) skill-creator system to generate, review, and optimize marketing campaigns with human-in-the-loop governance.

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — add ANTHROPIC_API_KEY for live AI (optional, mock data works without it)

# 2. Docker (recommended)
docker-compose up --build

# OR manual setup:

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and start with the **Onboarding** flow.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                      │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Onboarding│ │  Admin   │ │ Reviewer │ │  Ethics  │ │Publisher │ │
│  │  Wizard  │ │Dashboard │ │Dashboard │ │Dashboard │ │Dashboard │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       └─────────────┴────────────┴─────────────┴────────────┘       │
│                              │ API Service Layer                    │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ REST API
┌──────────────────────────────┼──────────────────────────────────────┐
│                        BACKEND (FastAPI)                            │
│                               │                                     │
│  ┌─────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │  Auth   │ │ Onboarding  │ │Advertisements│ │Analytics/Optimize│ │
│  │ Routes  │ │   Routes    │ │   Routes     │ │     Routes       │ │
│  └────┬────┘ └──────┬──────┘ └──────┬───────┘ └────────┬─────────┘ │
│       │              │               │                  │           │
│  ┌────┴────────────────────────────────────────────────┴─────────┐ │
│  │                      AI SERVICE LAYER                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │ │
│  │  │ Training │ │ Curator  │ │ Reviewer │ │   Optimizer +    │ │ │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Reinforcement RL │ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │ │
│  └───────┴─────────────┴────────────┴────────────────┘           │ │
│                               │                                     │
│  ┌────────────────────────────┴────────────────────────────────────┐│
│  │                     DATABASE (SQLAlchemy)                       ││
│  │  Companies │ Users │ Documents │ Ads │ Reviews │ Analytics │ RL ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                               │
                     ┌─────────┴─────────┐
                     │  Claude API       │
                     │  (Anthropic)      │
                     └───────────────────┘
```

---

## Module Ownership Map

Each module is self-contained with clear boundaries. Multiple developers can work simultaneously.

### Backend Modules

| # | Module | Files | Owner | Dependencies |
|---|--------|-------|-------|-------------|
| M1 | Database & Models | `backend/app/db/`, `backend/app/models/`, `backend/app/schemas/` | Backend Dev 1 | None |
| M2 | Auth & Users | `backend/app/core/`, `backend/app/api/routes/auth.py`, `routes/users.py` | Backend Dev 1 | M1 |
| M3 | Onboarding + Docs | `backend/app/api/routes/onboarding.py`, `routes/documents.py` | Backend Dev 2 | M1, M2 |
| M4 | AI Training | `backend/app/services/training/` | AI Dev | M1, Skills |
| M5 | Curator AI | `backend/app/services/ai/curator.py` | AI Dev | M4 |
| M6 | Reviewer AI | `backend/app/services/ai/reviewer.py` | AI Dev | M4 |
| M7 | Optimizer + RL | `backend/app/services/optimization/` | AI Dev | M5, M6 |
| M8 | Advertisement API | `backend/app/api/routes/advertisements.py`, `routes/analytics.py` | Backend Dev 2 | M5, M6 |

### Frontend Modules

| # | Module | Files | Owner | Backend Dep |
|---|--------|-------|-------|------------|
| M9 | Onboarding UI | `frontend/src/components/onboarding/` | Frontend Dev 1 | M3 |
| M10 | Auth UI | `frontend/src/components/auth/` | Frontend Dev 1 | M2 |
| M11 | Admin Dashboard | `frontend/src/components/admin/` | Frontend Dev 2 | M3, M8 |
| M12 | Reviewer Dashboard | `frontend/src/components/reviewer/` | Frontend Dev 3 | M6, M8 |
| M13 | Ethics Dashboard | `frontend/src/components/ethics/` | Frontend Dev 3 | M8 |
| M14 | Publisher Dashboard | `frontend/src/components/publisher/` | Frontend Dev 2 | M8 |
| M15 | Analytics Views | `frontend/src/components/analytics/` | Frontend Dev 4 | M7 |

### Shared Infrastructure

| Module | Files | Owner |
|--------|-------|-------|
| Shared Layout | `frontend/src/components/shared/` | Frontend Dev 1 |
| Auth Context | `frontend/src/contexts/` | Frontend Dev 1 |
| API Service | `frontend/src/services/api.js` | Frontend Dev 1 |
| Skill Templates | `skills/templates/` | AI Dev |

---

## Workflow (maps to PDF pages 1-2)

### 1. Onboarding (one-time)
- Company registers with name, logo, industry
- Admin account created (compulsory)
- Company documents uploaded (USP, compliance, policies, goals, ethics)

### 2. AI Training (one-time)
- Reads `curator_template.md` and `reviewer_template.md`
- Fills `{{PLACEHOLDER}}` tokens with company-specific data
- Stores customized SKILL.md in database per company

### 3. Campaign Creation
- Admin/Publisher creates campaign (Website, Ads, Voicebot*, Chatbot*)
- Sets budget, platforms, target audience

### 4. Strategy Generation (Curator AI)
- Curator uses customized SKILL.md as system prompt
- Ingests: input docs + company docs + reference docs (high priority)
- Outputs: structured JSON marketing strategy

### 5. Review Pipeline
- **AI Pre-Review**: Reviewer agent evaluates strategy, produces website requirements + ad details
- **Human Reviewer**: Reviews plan, edits budget/platforms, sends suggestions to AI
- **Ethics Reviewer**: Checks compliance, flags concerns, can request strategy redesign

### 6. Publishing
- Publisher deploys approved strategies
- Creates ads/websites using AI agent outputs
- Configures voicebot/chatbot parameters

### 7. Optimization Automation
- Weighted performance analysis (retention, CTR, follow-through, etc.)
- Reviewer context adds situational awareness
- Produces suggestions → human reviews → accepts/rejects

### 8. Reinforcement Learning
- Collects: user reviews + performance data + ethics reviews
- RAG formalizes into Reference Document (HIGH PRIORITY)
- Appends "Lessons Learned" to Curator + Reviewer SKILL.md
- Reference doc used in future strategy generation

---

## Roles & Permissions (maps to PDF pages 3-6)

| Role | Dashboard Features |
|------|--------------------|
| **Admin** | Campaign creation, user management, company documents (My Company), analytics |
| **Reviewer** | Review queue, strategy approval/rejection, budget edits, send suggestions to AI |
| **Ethics Reviewer** | Ethical analysis, strategy redesign requests, compliance document updates |
| **Publisher** | Publish campaigns, ad creator, website creator, bot config, analytics + optimizer |

---

## API Endpoints

| Method | Endpoint | Module | Auth |
|--------|----------|--------|------|
| POST | `/api/auth/login` | M2 | Public |
| POST | `/api/onboarding/` | M3 | Public |
| POST | `/api/onboarding/documents` | M3 | Admin |
| POST | `/api/onboarding/train` | M4 | Admin |
| GET/POST | `/api/users/` | M2 | Admin |
| GET/POST/PATCH/DELETE | `/api/documents/` | M3 | Admin, Ethics |
| GET/POST | `/api/advertisements/` | M8 | All roles |
| POST | `/api/advertisements/{id}/generate-strategy` | M5 | Admin, Publisher |
| POST | `/api/advertisements/{id}/submit-for-review` | M6 | Admin, Publisher |
| POST | `/api/advertisements/{id}/reviews` | M8 | Reviewer, Ethics |
| POST | `/api/advertisements/{id}/publish` | M8 | Publisher |
| PATCH | `/api/advertisements/{id}/bot-config` | M8 | Publisher |
| GET | `/api/analytics/{id}` | M7 | All roles |
| POST | `/api/analytics/{id}/optimize` | M7 | Admin, Publisher, Reviewer |
| POST | `/api/analytics/{id}/decision` | M7 | Admin, Publisher, Reviewer |

---

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy (async), SQLite (dev) / PostgreSQL (prod)
- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Recharts, Lucide icons
- **AI**: Anthropic Claude API (Sonnet), skill-creator pattern with SKILL.md templates
- **Auth**: JWT (python-jose), bcrypt password hashing, role-based access control
- **Infra**: Docker, Docker Compose

---

## Development Tips

- **Mock AI**: Leave `ANTHROPIC_API_KEY` empty — all AI services return mock data for UI development
- **Parallel Work**: Each module has a clear owner and minimal dependencies. Frontend devs only need the API service layer contract
- **Adding New Roles**: Add to `UserRole` enum, update `NAV_BY_ROLE` in `Layout.jsx`, add routes in `App.jsx`
- **Swapping DB**: Change `DATABASE_URL` in `.env` to PostgreSQL, run migrations
