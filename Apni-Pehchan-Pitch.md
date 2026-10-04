# Apni Pehchan — Unified Life-Stage Digital Identity & Record Network

*A cross-domain identity layer that lets a citizen's education, employment, finance, and healthcare records follow them — verifiable instantly, shared only with consent.*

---

## 1. The Problem

Digital ecosystems in India operate within strict institutional boundaries. As a citizen moves through life stages — school to college to job to bank to hospital — each system treats them as a stranger. Information usable in one environment is rarely interpretable in another, forcing repeated manual verification and inconsistent record accessibility.

**For individuals:** lost time, friction, and trust every time a record has to be re-proven from scratch.
**For institutions:** partial, siloed information that limits their ability to serve people well or detect fraud.

---

## 2. How We're Different

| Existing system | What it solves | What it doesn't solve |
|---|---|---|
| **Aadhaar** | One flat national identity number | No life-stage context, no way to link records across domains |
| **DigiLocker** | Document storage per user | Storage, not cross-institution verification |
| **ABHA** | Health records specifically | Healthcare only, no bridge to education/employment/finance |

Apni Pehchan is a **cross-domain, life-stage-aware identity layer** built on top of this existing infrastructure — not a replacement for it. One root identity generates four cryptographically unlinkable sub-identities (education, employment, finance, healthcare). An institution in one domain can verify a citizen without ever seeing their record in another domain.

- Aadhaar proves *who you are*, once.
- DigiLocker and ABHA store *what you have*, per domain.
- Apni Pehchan connects *how your record follows you* across life stages — without any single domain seeing the others.

---

## 3. What We've Built

### System workflow

1. **Enrollment** — a citizen registers with name and date of birth (birth-certificate-based in the full design; simplified for this prototype).
2. **Root ID generation** — a master identity is created, combining a small DOB-derived lookup prefix with a cryptographically random remainder.
3. **Sub-ID derivation** — four domain-specific identifiers (education, employment, finance, healthcare) are derived from the root ID. Each sub-ID begins with a deterministic DOB-based 4-character code, followed by a cryptographically derived remainder unique to that domain.
4. **Institutions issue signed records** — a registered institution (university, employer, bank, hospital) attaches a digitally signed record to the citizen's relevant sub-ID.
5. **Citizen-controlled sharing** — the citizen generates a time-limited consent/share code for a specific record and a specific verifier.
6. **Instant verification** — the verifier checks the record's digital signature and gets a valid/invalid result immediately — no document re-upload, no phone calls.

### Architecture

- **Frontend:** React + TypeScript (Vite), built with Manus — citizen dashboard, registration, record issuance, sharing, and verification screens, with multi-language support (English, Hindi, Bengali, Marathi, Punjabi).
- **Backend:** Python (FastAPI) — handles identity generation, cryptographic derivation, record signing, and verification logic.
- **Database:** Supabase (PostgreSQL) — stores citizens, sub-IDs, institutions, records, and consent grants.
- **Cryptography:** HMAC-SHA256 for sub-ID derivation (unlinkability between domains), ECDSA digital signatures for record authenticity.

### What the backend code actually does

**`crypto_utils.py` — the cryptographic core**
- `generate_root_id()` — creates the citizen's master ID: a small DOB-derived lookup prefix (quarter of birth + month position) plus 10 digits of cryptographically secure randomness.
- `generate_subid_prefix()` — derives each sub-ID's first 4 characters purely from date of birth: a month-group letter (A/B/C), the month's position within that group (1-4), and the day of birth in 2-digit hexadecimal.
- `derive_subid_remainder()` — uses HMAC-SHA256, keyed by the root ID, with the domain name ("education", "finance", etc.) as the message. This is what makes each domain's sub-ID mathematically unlinkable from the others — no one can derive one sub-ID from another without the root ID itself.
- `generate_institution_keypair()`, `sign_content()`, `verify_signature()` — ECDSA key generation and signing, so every institution-issued record carries a verifiable digital signature.

**`main.py` — the API**
- `POST /register` — creates a citizen, generates their root ID and all four sub-IDs.
- `POST /institutions/issue` — an institution signs and attaches a new record to a citizen's sub-ID (blocked if the institution has been suspended by an admin).
- `POST /consent/share` — the citizen generates a 24-hour share code for one record and one verifier.
- `POST /consent/verify` — checks a share code, verifies the record's signature, and logs the verification attempt.
- `GET /citizens/{id}` and `GET /citizens/{id}/records` — power the citizen dashboard.

**`admin.py` — governance layer (built, not yet wired into the frontend)**
- Dashboard stats (total citizens, records, verifications, institutions).
- Institution management — add new institutions (auto-generates their keypair), suspend/reactivate them.
- Citizen lookup by root ID only (never by name/DOB — keeps the privacy-by-design principle intact even for admins).
- Full audit logs of every consent grant and every verification attempt (valid or invalid).

### What the frontend does

A single-page React app with five views (Dashboard, Register, Issue a Record, Share Securely, Verify Record), a persistent sidebar, and a language switcher. It talks to the FastAPI backend over plain REST calls (`lib/api.ts`), storing only the citizen's ID locally in the browser to resume a session — no sensitive data is cached client-side.

---

## 4. What's Simplified for the Prototype (and Why)

Being upfront about this made the design more credible under scrutiny, not less:

- **Root ID randomness:** the current version uses a lightweight random-number generator suitable for a demo; a production build would use a cryptographically secure generator at greater bit-length, matching or exceeding Aadhaar's effective ~36-bit random keyspace.
- **No biometric de-duplication yet:** Aadhaar's real uniqueness guarantee comes from comparing biometrics against the full national database at enrollment, separate from the number's structure. This is scoped as a required future addition, not something a hackathon prototype can build from scratch.
- **Admin panel is built but not yet connected to the frontend UI.**

---

## 5. What We Plan to Add

- **Biometric/Aadhaar-linked de-duplication at enrollment** — closes the "no duplicate identities" claim with an actual enforcement mechanism, not just random-ID collision odds.
- **Tamper-evident audit ledger (blockchain):** not used for "encryption" — that was an early design misconception we corrected — but for anchoring a hash of every record-issuance event on a distributed ledger, so the full history of who issued what, and when, is publicly auditable and cannot be silently altered after the fact.
- **Real ABHA integration** for existing citizens' healthcare records, instead of the current mock.
- **Formal governance model** — proposed as public digital infrastructure under a dedicated authority, similar in spirit to UIDAI (Aadhaar) or NPCI (UPI): government-partnered, not a monetized product.
- **Phased institutional rollout** — pilot with a small set of willing institutions per domain before wider adoption, following the same pattern UPI and DigiLocker used.
- **Dispute/correction workflow** — a citizen-initiated flow to flag and correct an inaccurate record, routed back to the issuing institution for re-verification and re-signing.
- **Fallback enrollment path** for citizens without a birth certificate, via Aadhaar biometric verification instead.

---

## 6. Why This Matters

Apni Pehchan doesn't ask citizens to trust a new authority with everything — it asks institutions to trust a signature, and asks citizens to control who sees what. That's the core trade a good identity system has to make, and it's the trade this architecture is built around.

---

## 7. PPT Instructions — Repoforge 2026 Submission Template

The hackathon's official template (`Repoforge_2026_Template.pptx`) is fixed: **6 slides only**, submit as `TeamName.pptx`, and delete its "Important Instructions" slide before uploading. Use this section as the content-to-slide map — a filled example (`ApniPehchan.pptx`) follows the same mapping.

| # | Template slide | What goes on it | Source in this doc |
|---|---|---|---|
| 1 | **Team Details** | Team name, team leader, problem statement number, team members | — (fill with your actual team info) |
| 2 | **Idea Title (Proposed Solution)** | Title: *Apni Pehchan — Unified Life-Stage Digital Identity Layer*. Three bullets: what it is (root ID → 4 unlinkable sub-IDs), how it addresses the problem (instant cross-domain verification), what's novel (positioning vs. Aadhaar/DigiLocker/ABHA) | Sections 1 and 2 |
| 3 | **Technical Approach** | Bullet 1: tech stack (React+TS frontend, FastAPI backend, Supabase/Postgres, HMAC-SHA256, ECDSA). Bullet 2: methodology — the enroll → derive → sign → share → verify pipeline, and that it's a working prototype, not just a diagram | Section 3, "Architecture" and "What the backend code actually does" |
| 4 | **Workflow/Wire Frame/Use Case** | Bullet 1: the 5-step workflow written out step-by-step. Bullet 2: a visual — insert your architecture or screen-flow diagram/screenshots here (this is the one slide judges expect an actual image on). Bullet 3: key components list | Section 3, "System workflow" |
| 5 | **Feasibility and Viability** | Bullet 1: why it's feasible now (proven crypto primitives, working end-to-end prototype). Bullet 2: real challenges (institutional adoption, biometric de-dup gap, governance). Bullet 3: your mitigation strategy for each (phased rollout, public-authority governance model, de-dup roadmap) | Sections 4 and 5 |
| 6 | **Research and References** | Aadhaar/UIDAI, DigiLocker, ABHA, W3C Verifiable Credentials, EU eIDAS, and the HMAC-SHA256/ECDSA standards you built on | Section 5, and the Aadhaar-comparison research done earlier in this project |

**Delivery notes:**
- Keep every bullet to 1–2 lines where possible — the template's text boxes are a fixed size, and long paragraphs will overflow onto the footer bar. If a bullet runs long, shorten it rather than shrinking the font past ~20pt.
- Slide 4 (Workflow) is the one place judges most want an actual visual, not just text — replace the `[Insert architecture / screen-flow diagram here]` placeholder with a real diagram or app screenshot before submitting.
- Fill in `[Insert PS No.]`, team members, and your team leader's full name on the Team Details slide — those are left as placeholders in the example file since we don't have that roster.
- Do not add slides, resize the template's boxes, or change its logos/branding — the rules cap the deck at 6 slides and require the template as-is.
