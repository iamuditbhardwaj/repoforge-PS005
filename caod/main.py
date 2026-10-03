import secrets
import uuid
import os
from datetime import datetime, timedelta, timezone
from typing import Any, cast

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import RegisterRequest, IssueRecordRequest, ShareRequest, VerifyRequest
from database import supabase
from admin import admin_router
from crypto_utils import (
    generate_root_id,
    generate_subid,
    sign_content,
    verify_signature,
)

app = FastAPI(title="Apni Pehchan Backend")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOMAINS = ["education", "employment", "finance", "healthcare"]


def first_data_row(result: Any) -> dict[str, Any] | None:
    data = getattr(result, "data", None)
    if not isinstance(data, list) or not data:
        return None
    return cast(dict[str, Any], data[0])


app.include_router(admin_router)


@app.post("/register")
def register(req: RegisterRequest):
    root_id = generate_root_id(req.dob)
    citizen_id = str(uuid.uuid4())

    supabase.table("citizens").insert({
        "id": citizen_id,
        "name": req.name,
        "dob": req.dob.isoformat(),
        "root_id": root_id,
    }).execute()

    sub_ids = {}
    for domain in DOMAINS:
        sub_id = generate_subid(root_id, domain, req.dob)
        sub_ids[domain] = sub_id
        supabase.table("sub_ids").insert({
            "id": str(uuid.uuid4()),
            "citizen_id": citizen_id,
            "domain": domain,
            "sub_id": sub_id,
        }).execute()

    return {"citizen_id": citizen_id, "root_id": root_id, "sub_ids": sub_ids}


@app.post("/institutions/issue")
def issue_record(req: IssueRecordRequest):
    inst_result = supabase.table("institutions").select("*").eq(
        "name", req.institution_name
    ).limit(1).execute()
    institution = first_data_row(inst_result)
    if institution is None:
        raise HTTPException(404, "Institution not found")

    sub_result = supabase.table("sub_ids").select("*").eq(
        "sub_id", req.sub_id
    ).limit(1).execute()
    sub_id = first_data_row(sub_result)
    if sub_id is None:
        raise HTTPException(404, "Sub-ID not found")

    if sub_id["domain"] != institution["domain"]:
        raise HTTPException(400, "Institution domain does not match this Sub-ID's domain")

    if institution.get("status", "active") == "suspended":
        raise HTTPException(403, "This institution has been suspended and cannot issue records")

    signature = sign_content(
        institution["private_key"].encode(), req.title + req.content
    )

    record_id = str(uuid.uuid4())
    supabase.table("records").insert({
        "id": record_id,
        "sub_id_id": sub_id["id"],
        "institution_id": institution["id"],
        "title": req.title,
        "content": req.content,
        "signature": signature,
    }).execute()

    return {"record_id": record_id, "signature": signature}


@app.post("/consent/share")
def share_record(req: ShareRequest):
    record_result = supabase.table("records").select("*").eq(
        "id", req.record_id
    ).limit(1).execute()
    if not record_result.data:
        raise HTTPException(404, "Record not found")

    share_code = secrets.token_hex(16).upper()
    supabase.table("consent_grants").insert({
        "id": str(uuid.uuid4()),
        "record_id": req.record_id,
        "share_code": share_code,
        "verifier_name": req.verifier_name,
        "expires_at": (
            datetime.now(timezone.utc) + timedelta(hours=24)
        ).isoformat(),
    }).execute()

    return {"share_code": share_code}


@app.post("/consent/verify")
def verify_record(req: VerifyRequest):
    grant_result = supabase.table("consent_grants").select("*").eq(
        "share_code", req.share_code
    ).limit(1).execute()
    if not grant_result.data:
        raise HTTPException(404, "Invalid or unknown share code")

    grant = first_data_row(grant_result)
    if grant is None:
        raise HTTPException(404, "Invalid or unknown share code")

    expires_at = datetime.fromisoformat(str(grant["expires_at"]))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(410, "This share code has expired")

    record_result = supabase.table("records").select("*").eq(
        "id", grant["record_id"]
    ).limit(1).execute()
    if not record_result.data:
        raise HTTPException(404, "Record not found")
    record = first_data_row(record_result)
    if record is None:
        raise HTTPException(404, "Record not found")

    institution_result = supabase.table("institutions").select("*").eq(
        "id", record["institution_id"]
    ).limit(1).execute()
    if not institution_result.data:
        raise HTTPException(404, "Institution not found")
    institution = first_data_row(institution_result)
    if institution is None:
        raise HTTPException(404, "Institution not found")

    valid = verify_signature(
        institution["public_key"].encode(),
        record["title"] + (record["content"] or ""),
        record["signature"],
    )

    supabase.table("verification_log").insert({
        "id": str(uuid.uuid4()),
        "record_id": record["id"],
        "share_code": req.share_code,
        "valid": valid,
        "verifier_name": grant.get("verifier_name"),
    }).execute()

    return {
        "valid": valid,
        "title": record["title"],
        "domain": institution["domain"],
        "issuer": institution["name"],
    }


@app.get("/citizens/{citizen_id}/records")
def get_records(citizen_id: str):
    subs = supabase.table("sub_ids").select("id, domain, sub_id").eq(
        "citizen_id", citizen_id
    ).execute()
    rows = subs.data if isinstance(subs.data, list) else []
    sub_id_map: dict[str, dict[str, Any]] = {
        str(s["id"]): cast(dict[str, Any], s) for s in rows if isinstance(s, dict)
    }
    if not sub_id_map:
        return []

    records = supabase.table("records").select("*").in_(
        "sub_id_id", list(sub_id_map.keys())
    ).execute()
    record_rows = records.data if isinstance(records.data, list) else []

    return [
        {**cast(dict[str, Any], r), "domain": cast(dict[str, Any], sub_id_map.get(str(r.get("sub_id_id")), {})).get("domain")}
        for r in record_rows if isinstance(r, dict)
    ]


@app.get("/citizens/{citizen_id}")
def get_citizen(citizen_id: str):
    citizen_result = supabase.table("citizens").select("*").eq(
        "id", citizen_id
    ).limit(1).execute()
    if not citizen_result.data:
        raise HTTPException(404, "Citizen not found")
    citizen = first_data_row(citizen_result)
    if citizen is None:
        raise HTTPException(404, "Citizen not found")

    subs = supabase.table("sub_ids").select("domain, sub_id").eq(
        "citizen_id", citizen_id
    ).execute()
    sub_rows = subs.data if isinstance(subs.data, list) else []

    return {
        **citizen,
        "sub_ids": {
            str(s["domain"]): s["sub_id"]
            for s in sub_rows if isinstance(s, dict) and "domain" in s and "sub_id" in s
        },
    }
