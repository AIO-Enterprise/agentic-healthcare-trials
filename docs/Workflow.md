Phase 1 — Data Foundation (nothing works without this)
1. models/models.py — Start here. Define all 9 tables and enums before writing a single line of business logic. Every module downstream reads/writes these. Get the relationships, status enums, and JSON fields right first.

2. db/database.py — Wire up the async engine and get_db() dependency. Test that init_db() creates tables cleanly.

3. schemas/schemas.py — Write Pydantic schemas next. These define your API contract — what comes in and goes out of every endpoint. Doing this before routes forces you to think clearly about data shapes.

Phase 2 — Auth & Users (gate everything behind this)
4. core/security.py — hash_password, verify_password, create_access_token, decode_token, get_current_user, require_roles. Test JWT round-trips in isolation.

5. api/routes/auth.py — Just one endpoint. Get login working and returning a valid JWT with role + company_id baked in.

6. api/routes/users.py — CRUD for team members. Depends on auth working correctly.

Phase 3 — Onboarding & Knowledge Base (AI can't run without company data)
7. api/routes/onboarding.py — Company + admin user creation. This is the entry point for every new tenant.

8. api/routes/documents.py — The knowledge base CRUD. Every AI service reads these docs as context — get upload, versioning, and priority right here.

Phase 4 — AI Skill System (the core of the platform)
9. skills/templates/curator_template.md + reviewer_template.md — Write the SKILL.md templates carefully. These are your AI prompts — the quality of every downstream output depends on how well these are written. Invest real time here.

10. services/training/trainer.py — Reads templates, fills {{PLACEHOLDERS}} with company data, saves to SkillConfig. Test by checking the generated skill_md actually looks right in the DB.

Phase 5 — AI Services (the value-generating core)
11. services/ai/curator.py — Loads SkillConfig as system prompt, builds context from company docs, calls Claude, returns strategy JSON. Build and test with a real API key. Nail the context construction — this is where RAG quality matters most.

12. services/ai/reviewer.py — Takes Curator's output, produces website requirements + ad specs + ethical flags. Depends on Curator output format being stable, so do Curator first.

Phase 6 — Campaign Lifecycle Routes
13. api/routes/advertisements.py — The most complex route file. Build it endpoint by endpoint following the status machine:


draft → generate-strategy → submit-for-review → review → publish
Wire in Curator and Reviewer services here.

Phase 7 — Optimization Loop
14. services/optimization/optimizer.py — Weighted performance scoring + Claude suggestions. Depends on having real AdAnalytics data. Build the scoring math first, then add Claude on top.

15. services/optimization/reinforcement.py — The most sophisticated service. Build last in the backend because it depends on everything: ads, analytics, reviews, optimizer logs, skills, and documents all need to exist and work first.

16. api/routes/analytics.py — Routes for analytics retrieval, optimizer trigger, and human decision recording. Wire in optimizer + reinforcement services here.

Phase 8 — Frontend (build against a stable API)
Build frontend in the same dependency order as backend:

Order	Component	Why
1	api.js + AuthContext.jsx	Everything calls the API; auth wraps everything
2	Layout.jsx (ProtectedRoute, Sidebar)	Shell needed before any page works
3	LoginPage.jsx + OnboardingPage.jsx	Entry points — no auth = no access
4	AdminDashboard.jsx + UserManagement.jsx + MyCompany.jsx	Basic admin functions
5	CampaignCreator.jsx	Depends on ads API + AI services being ready
6	ReviewerDashboard.jsx	Depends on campaigns existing
7	EthicsDashboard.jsx	Depends on reviewer flow being done
8	PublisherDashboard.jsx	Depends on approved campaigns existing
9	AnalyticsPage.jsx	Depends on published campaigns + analytics data
Key Principles for Each Module
Models — don't add columns lazily mid-build; plan the full schema upfront and use Alembic migrations if you add tables later.

Skill templates — treat these like code, not just text. Version control them. The quality of your SKILL.md directly determines output quality.

Curator/Reviewer — build the context construction (_build_context) very carefully. What you send to Claude is more important than how you parse the response.

Reinforcement — this is where most platforms stop. If you build this properly (lessons appended back to SkillConfig, high-priority reference docs written to DB), campaigns genuinely improve over time without code changes.

Frontend last — the frontend is a thin UI over the API. Build it after the API contract is stable, otherwise you'll be changing both simultaneously.

Bottom line: models → auth → onboarding → documents → skill templates → trainer → curator → reviewer → ads routes → optimizer → reinforcement → analytics routes → frontend