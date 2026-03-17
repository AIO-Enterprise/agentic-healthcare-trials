# Marketing Analytics Platform — Architecture

## System Overview

An AI-powered marketing automation platform that uses Claude's skill-creator system to generate, review, and optimize marketing campaigns (websites, ads, voicebots, chatbots) with human-in-the-loop governance.

## Module Map (for parallel development)

| Module | Owner | Directory | Dependencies |
|--------|-------|-----------|-------------|
| **M1: Database & Models** | Backend Dev 1 | `backend/app/db/`, `backend/app/models/` | None |
| **M2: Auth & Users** | Backend Dev 1 | `backend/app/api/routes/auth.py` | M1 |
| **M3: Onboarding API** | Backend Dev 2 | `backend/app/api/routes/onboarding.py` | M1, M2 |
| **M4: AI Training Service** | AI Dev | `backend/app/services/training/` | M1, Skills |
| **M5: Curator Service** | AI Dev | `backend/app/services/ai/curator.py` | M4 |
| **M6: Reviewer Service** | AI Dev | `backend/app/services/ai/reviewer.py` | M4 |
| **M7: Optimizer Service** | AI Dev | `backend/app/services/optimization/` | M5, M6 |
| **M8: Ad/Website Generation** | Backend Dev 2 | `backend/app/api/routes/advertisements.py` | M5, M6 |
| **M9: Onboarding UI** | Frontend Dev 1 | `frontend/src/components/onboarding/` | M3 |
| **M10: Auth UI** | Frontend Dev 1 | `frontend/src/components/auth/` | M2 |
| **M11: Admin Dashboard UI** | Frontend Dev 2 | `frontend/src/components/admin/` | M3, M8 |
| **M12: Reviewer Dashboard UI** | Frontend Dev 3 | `frontend/src/components/reviewer/` | M6, M8 |
| **M13: Ethics Dashboard UI** | Frontend Dev 3 | `frontend/src/components/ethics/` | M8 |
| **M14: Publisher Dashboard UI** | Frontend Dev 2 | `frontend/src/components/publisher/` | M8 |
| **M15: Analytics UI** | Frontend Dev 4 | `frontend/src/components/analytics/` | M7 |

## Data Flow

```
Input Docs → Curator (strategy) → Reviewer (approve/edit) → Publisher
                                      ↓                        ↓
                               Ethics Reviewer          Website Agent / Ad Agent
                                      ↓                        ↓
                               Reinforcement          Optimizer ← Performance Data
                               Learning                   ↓
                               (update skill.md)    Human-in-Loop Suggestions
```

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| Admin | Full access: onboarding, user mgmt, company docs, ad creation, analytics |
| Reviewer | Review strategies, edit plans, adjust budgets, send suggestions to AI |
| Ethics Reviewer | Ethical analysis, redesign strategy, update compliance docs |
| Publisher | Publish strategies, create ads/websites, configure bots, deploy, analytics |
