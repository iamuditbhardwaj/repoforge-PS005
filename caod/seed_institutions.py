"""
Seed four demo institutions with ECDSA keypairs.

Run once after applying schema.sql:
    python seed_institutions.py

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the local .env file.
"""

import uuid

from crypto_utils import generate_institution_keypair
from database import supabase


INSTITUTIONS = [
    {"name": "State University", "domain": "education"},
    {"name": "Horizon Employers Ltd", "domain": "employment"},
    {"name": "National Trust Bank", "domain": "finance"},
    {"name": "City General Hospital", "domain": "healthcare"},
]


def seed() -> None:
    for institution in INSTITUTIONS:
        existing = supabase.table("institutions").select("id").eq(
            "name", institution["name"]
        ).maybe_single().execute()
        if existing.data:
            print(f"Skipping {institution['name']} - already exists.")
            continue

        private_key_pem, public_key_pem = generate_institution_keypair()
        supabase.table("institutions").insert({
            "id": str(uuid.uuid4()),
            "name": institution["name"],
            "domain": institution["domain"],
            "public_key": public_key_pem.decode(),
            "private_key": private_key_pem.decode(),
            "status": "active",
        }).execute()
        print(f"Created {institution['name']} ({institution['domain']}).")


if __name__ == "__main__":
    seed()
    print("Done. Institutions are ready for /institutions/issue calls.")
