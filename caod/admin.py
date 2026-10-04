"""Protected admin API for Apni Pehchan."""

import os
import uuid

from fastapi import APIRouter, Header, HTTPException

from crypto_utils import generate_institution_keypair
from database import supabase

admin_router = APIRouter(prefix="/admin", tags=["admin"])
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
VALID_DOMAINS = {"education", "employment", "finance", "healthcare"}


def require_admin(x_admin_key: str = Header(...)) -> None:
    if not ADMIN_API_KEY or x_admin_key != ADMIN_API_KEY:
        raise HTTPException(401, "Invalid admin key")


@admin_router.get("/dashboard")
def dashboard_stats(x_admin_key: str = Header(...)):
    require_admin(x_admin_key)
    citizens = supabase.table("citizens").select("id", count="exact").execute()
    records = supabase.table("records").select("id", count="exact").execute()
    verifications = supabase.table("verification_log").select("id", count="exact").execute()
    institutions = supabase.table("institutions").select("id", count="exact").execute()
    return {
        "total_citizens": citizens.count or 0,
        "total_records": records.count or 0,
        "total_verifications": verifications.count or 0,
        "total_institutions": institutions.count or 0,
    }


@admin_router.get("/institutions")
def list_institutions(x_admin_key: str = Header(...)):
    require_admin(x_admin_key)
    result = supabase.table("institutions").select(
        "id, name, domain, status, created_at"
    ).order("created_at", desc=True).execute()
    return result.data


@admin_router.post("/institutions")
def add_institution(name: str, domain: str, x_admin_key: str = Header(...)):
    require_admin(x_admin_key)
    if domain not in VALID_DOMAINS:
        raise HTTPException(400, "Invalid institution domain")
    if not name.strip():
        raise HTTPException(400, "Institution name is required")

    private_key, public_key = generate_institution_keypair()
    institution_id = str(uuid.uuid4())
    supabase.table("institutions").insert({
        "id": institution_id,
        "name": name.strip(),
        "domain": domain,
        "public_key": public_key.decode(),
        "private_key": private_key.decode(),
        "status": "active",
    }).execute()
    return {"id": institution_id, "name": name.strip(), "domain": domain, "status": "active"}


@admin_router.post("/institutions/{institution_id}/suspend")
def suspend_institution(institution_id: str, x_admin_key: str = Header(...)):
    require_admin(x_admin_key)
    result = supabase.table("institutions").update({"status": "suspended"}).eq(
        "id", institution_id
    ).execute()
    if not result.data:
        raise HTTPException(404, "Institution not found")
    return {"id": institution_id, "status": "suspended"}


@admin_router.post("/institutions/{institution_id}/reactivate")
def reactivate_institution(institution_id: str, x_admin_key: str = Header(...)):
    require_admin(x_admin_key)
    result = supabase.table("institutions").update({"status": "active"}).eq(
        "id", institution_id
    ).execute()
    if not result.data:
        raise HTTPException(404, "Institution not found")
    return {"id": institution_id, "status": "active"}


@admin_router.get("/institutions/{institution_id}/records")
def institution_records(institution_id: str, x_admin_key: str = Header(...)):
    require_admin(x_admin_key)
    result = supabase.table("records").select(
        "id, title, content, signature, sub_id_id, created_at"
    ).eq("institution_id", institution_id).order("created_at", desc=True).execute()
    return result.data


@admin_router.get("/citizens/search")
def search_citizen_by_root_id(root_id: str, x_admin_key: str = Header(...)):
    require_admin(x_admin_key)
    citizen_result = supabase.table("citizens").select(
        "id, root_id, created_at"
    ).eq("root_id", root_id).limit(1).execute()
    if not citizen_result.data:
        raise HTTPException(404, "No citizen found for this root ID")

    citizen = citizen_result.data[0]
    subs = supabase.table("sub_ids").select("id, domain").eq(
        "citizen_id", citizen["id"]
    ).execute()
    domain_by_sub_id = {item["id"]: item["domain"] for item in subs.data}
    records = []
    if domain_by_sub_id:
        records = supabase.table("records").select(
            "id, title, sub_id_id, created_at"
        ).in_("sub_id_id", list(domain_by_sub_id)).execute().data

    return {
        "citizen_id": citizen["id"],
        "root_id": citizen["root_id"],
        "created_at": citizen["created_at"],
        "record_count": len(records),
        "records_by_domain": {
            domain_by_sub_id[item["sub_id_id"]]: item["title"] for item in records
        },
    }


@admin_router.get("/consent/audit")
def consent_audit_log(x_admin_key: str = Header(...)):
    require_admin(x_admin_key)
    result = supabase.table("consent_grants").select(
        "id, record_id, share_code, verifier_name, expires_at, created_at"
    ).order("created_at", desc=True).limit(200).execute()
    return result.data


@admin_router.get("/verifications/log")
def verification_log(x_admin_key: str = Header(...)):
    require_admin(x_admin_key)
    result = supabase.table("verification_log").select(
        "id, record_id, share_code, valid, verifier_name, created_at"
    ).order("created_at", desc=True).limit(200).execute()
    return result.data
