# Apni Pehchan — अपनी पहचान

**Unified Life-Stage Digital Identity & Record Network**

*One root identity. Four unlinkable domain identities. Records that follow you — verifiable instantly, shared only with consent.*

---

## The Problem

Digital ecosystems in India operate within strict institutional boundaries. As a citizen moves through life — school, college, first job, a bank account, a hospital visit — every system treats them as a stranger. Information usable in one environment is rarely interpretable in another, forcing repeated manual verification and inconsistent record accessibility.

## The Idea

Apni Pehchan is a cross-domain identity layer built **on top of** existing infrastructure (Aadhaar, DigiLocker, ABHA) — not a replacement for any of them.

- A citizen enrolls once and receives a **root ID** — cryptographically random, not derivable from personal data.
- From that root ID, **four domain-specific Sub-IDs** are derived (education, employment, finance, healthcare) using HMAC-SHA256 key derivation — the same principle used by hierarchical-deterministic (HD) crypto wallets.
- Each Sub-ID is **mathematically unlinkable** from the others. An institution in one domain can verify a citizen without ever seeing their record in another domain.
- Institutions **digitally sign (ECDSA)** every record they issue, so it's tamper-evident.
- Citizens generate **time-limited consent codes** to share a specific record with a specific verifier — nothing is shared by default.

---

## How It Works

```
Citizen registers (name + DOB)
        │
        ▼
Root ID generated (cryptographically random)
        │
        ▼
4 Sub-IDs derived via HMAC-SHA256 (education / employment / finance / healthcare)
        │
        ▼
Institution issues a record → signs it with its private key (ECDSA)
        │
        ▼
Citizen generates a 24-hour consent/share code for one record + one verifier
        │
        ▼
Verifier checks the share code → signature verified → instant valid/invalid
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite), multi-language UI (English, Hindi, Bengali, Marathi, Punjabi) |
| Backend | Python, FastAPI |
| Database | Supabase (PostgreSQL) |
| Identity derivation | HMAC-SHA256 |
| Record signing | ECDSA (SECP256R1) |

---

## Repository Structure

```
.
├── caod/                    # Backend (FastAPI)
│   ├── main.py               # API endpoints: register, issue, share, verify
│   ├── crypto_utils.py        # Root ID + Sub-ID generation, HMAC derivation, ECDSA signing
│   ├── models.py              # Request schemas (Pydantic)
│   ├── database.py            # Supabase client
│   ├── schema.sql             # Database table definitions
│   ├── requirements.txt
│   └── .env.example
│
└── frontend sutup/          # Frontend (React + Vite)
    ├── client/src/
    │   ├── pages/              # Dashboard, Register, Issue, Share, Verify
    │   ├── components/         # UI components
    │   └── lib/api.ts          # Backend API client
    ├── server/index.ts
    └── .env.example
```

---

## Getting Started

### Backend

```bash
cd caod
pip install -r requirements.txt --break-system-packages
cp .env.example .env   # fill in your Supabase project URL + service role key
```

Run `schema.sql` in your Supabase project's SQL editor, then start the server:

```bash
uvicorn main:app --reload
```

### Frontend

```bash
cd "frontend sutup"
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your backend's URL
npm run dev
```

By default the frontend expects the backend at `http://127.0.0.1:8000`.

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/register` | Register a citizen, generate root ID + 4 Sub-IDs |
| `POST` | `/institutions/issue` | An institution issues and signs a record |
| `POST` | `/consent/share` | Citizen generates a time-limited share code for a record |
| `POST` | `/consent/verify` | Verifier checks a share code's signature |
| `GET` | `/citizens/{id}` | Citizen's profile and Sub-IDs |
| `GET` | `/citizens/{id}/records` | All records for a citizen |

---

## Security Notes

- Root IDs are generated using Python's `secrets` module — a cryptographically secure random source, not derived from personal information.
- Sub-IDs are derived via HMAC-SHA256, keyed by the root ID — this makes them unlinkable from one another without knowledge of the root ID itself.
- All records are signed with ECDSA (SECP256R1); any tampering invalidates the signature.
- `.env` files are gitignored and contain no real secrets in this repository — copy `.env.example` and fill in your own values locally.

---

## What's Simplified for This Prototype

- No biometric/Aadhaar-linked de-duplication at enrollment yet — a required addition before real-world use, to prevent duplicate identity registration.
- No blockchain-based audit ledger yet — planned to anchor a hash of every record-issuance event for a publicly auditable, tamper-evident history.
- Institution keypairs are currently stored alongside application data for demo simplicity; a production system would isolate private keys per institution or in a dedicated secrets manager.

---

## Roadmap

- [ ] Biometric/Aadhaar-linked de-duplication at enrollment
- [ ] Tamper-evident issuance ledger (blockchain-anchored audit trail)
- [ ] Real ABHA integration for existing citizens' health records
- [ ] Admin governance panel (institution management, audit logs)
- [ ] Dispute/correction workflow for inaccurate records
- [ ] Fallback enrollment path for citizens without a birth certificate

---

## References

- [UIDAI — Aadhaar](https://uidai.gov.in)
- [DigiLocker](https://digilocker.gov.in)
- [ABHA — Ayushman Bharat Health Account](https://abha.abdm.gov.in)
- [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)
- [NPCI — UPI governance model](https://www.npci.org.in)

---

## Team

*[Nameless Knull] — [Lead:-Rakshit Shenoy] — [Software Devs:-muhammad mujawar, Rajveer Sarvaiya, Udit Anil Bhardwaj ]*

Built for Repoforge 2026, XIE – CSI Student Chapter.
