from pydantic import BaseModel
from datetime import date


class RegisterRequest(BaseModel):
    name: str
    dob: date


class IssueRecordRequest(BaseModel):
    sub_id: str
    institution_name: str
    title: str
    content: str = ""


class ShareRequest(BaseModel):
    record_id: str
    verifier_name: str


class VerifyRequest(BaseModel):
    share_code: str
