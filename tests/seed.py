"""
Seed script — loads sample_company.json and runs the full onboarding pipeline:

  1. Register company + admin user
  2. Upload all documents (USP, compliance, policy, marketing goals, ethical guidelines)
  3. Trigger AI training (generates Curator + Reviewer skills)

Usage:
    python tests/seed.py                        # uses defaults
    python tests/seed.py --url http://localhost:8000
    python tests/seed.py --reset                # deletes existing DB first
"""

import argparse
import json
import sys
import requests
from pathlib import Path

BASE_URL = "http://localhost:8000/api"
FIXTURE  = Path(__file__).parent / "fixtures" / "sample_company.json"

# Default admin credentials created by this seed
ADMIN_EMAIL    = "admin@medicare.com"
ADMIN_PASSWORD = "medicare123"
ADMIN_NAME     = "MediCare Admin"


def load_fixture() -> dict:
    with open(FIXTURE) as f:
        return json.load(f)


def step(label: str):
    print(f"\n{'─' * 60}")
    print(f"  {label}")
    print('─' * 60)


def ok(msg: str):
    print(f"  ✓  {msg}")


def fail(msg: str, resp: requests.Response = None):
    print(f"  ✗  {msg}")
    if resp is not None:
        print(f"     Status : {resp.status_code}")
        try:
            print(f"     Detail : {resp.json()}")
        except Exception:
            print(f"     Body   : {resp.text[:300]}")
    sys.exit(1)


# ── 1. Register company ───────────────────────────────────────────────────────

def register(data: dict, base: str) -> tuple[str, str]:
    """Returns (company_id, admin_user_id)."""
    step("Step 1 — Register company + admin user")

    payload = {
        "company_name":   data["company_name"],
        "industry":       data["industry"],
        "admin_email":    ADMIN_EMAIL,
        "admin_password": ADMIN_PASSWORD,
        "admin_name":     ADMIN_NAME,
    }

    resp = requests.post(f"{base}/onboarding/", json=payload)

    if resp.status_code == 409:
        print("  ⚠  Company already exists — skipping registration, continuing with login.")
        token, company_id = login(base)
        return company_id, None

    if not resp.ok:
        fail("Registration failed", resp)

    body = resp.json()
    ok(f"Company ID  : {body['company_id']}")
    ok(f"Admin ID    : {body['admin_user_id']}")
    return body["company_id"], body["admin_user_id"]


# ── 2. Login to get JWT ───────────────────────────────────────────────────────

def login(base: str) -> tuple[str, str]:
    """Returns (token, company_id)."""
    resp = requests.post(f"{base}/auth/login", json={
        "email":    ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
    })

    if not resp.ok:
        fail("Login failed", resp)

    body = resp.json()
    ok(f"Logged in as {ADMIN_EMAIL}  (role: {body['role']})")
    return body["access_token"], body["company_id"]


# ── 3. Upload documents ───────────────────────────────────────────────────────

def upload_documents(data: dict, token: str, base: str):
    step("Step 2 — Upload company documents")

    headers = {"Authorization": f"Bearer {token}"}

    docs = [
        ("usp",                "USP — MediCare+ Value Proposition",
         data["usp_summary"]),

        ("marketing_goal",     "Marketing Goals Q2 2026",
         "\n".join(f"- {g}" for g in data["marketing_goals"])),

        ("compliance",         "Compliance & Legal Notes",
         "\n".join(f"- {c}" for c in data["compliance_notes"])),

        ("ethical_guideline",  "Ethical Guidelines",
         "\n".join(f"- {e}" for e in data["ethical_guidelines"])),

        ("policy",             "Lessons Learned",
         data["lessons_learned"]),
    ]

    for doc_type, title, content in docs:
        resp = requests.post(
            f"{base}/onboarding/documents",
            headers=headers,
            data={"doc_type": doc_type, "title": title, "content": content},
        )
        if not resp.ok:
            fail(f"Failed to upload '{title}'", resp)
        ok(f"Uploaded [{doc_type}]  \"{title}\"")


# ── 4. Trigger AI training ────────────────────────────────────────────────────

def trigger_training(token: str, base: str):
    step("Step 3 — Trigger AI training (Curator + Reviewer skills)")

    resp = requests.post(
        f"{base}/onboarding/train",
        headers={"Authorization": f"Bearer {token}"},
    )

    if not resp.ok:
        fail("Training failed", resp)

    body = resp.json()
    ok(f"Curator ready  : {body['curator_ready']}")
    ok(f"Reviewer ready : {body['reviewer_ready']}")
    ok(f"Skill versions : {body['skill_versions']}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed MediCare+ test data")
    parser.add_argument("--url", default="http://localhost:8000/api",
                        help="Base API URL (default: http://localhost:8000/api)")
    args = parser.parse_args()
    base = args.url.rstrip("/")

    print(f"\n{'═' * 60}")
    print(f"  Marketing Analytics Platform — Seed Script")
    print(f"  Target : {base}")
    print(f"{'═' * 60}")

    data = load_fixture()

    company_id, _ = register(data, base)
    token, company_id = login(base)
    upload_documents(data, token, base)
    trigger_training(token, base)

    print(f"\n{'═' * 60}")
    print(f"  Seed complete!")
    print(f"  Company  : {data['company_name']}")
    print(f"  ID       : {company_id}")
    print(f"  Login    : {ADMIN_EMAIL}  /  {ADMIN_PASSWORD}")
    print(f"  Frontend : http://localhost:3000")
    print(f"{'═' * 60}\n")


if __name__ == "__main__":
    main()
