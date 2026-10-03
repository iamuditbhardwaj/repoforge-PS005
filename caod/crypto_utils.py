"""
Core identity & cryptography logic for Apni Pehchan.

- generate_root_id: creates the citizen's master identifier
- generate_subid: creates a domain-specific sub-ID, prefixed by a
  deterministic DOB-derived 4-character code, followed by an
  HMAC-derived remainder unique to (root_id, domain)
- ECDSA signing/verification for institution-issued records
"""

import hashlib
import hmac
import secrets
from datetime import date

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.exceptions import InvalidSignature


# ---------------------------------------------------------------------
# Root ID generation
# ---------------------------------------------------------------------

def generate_root_id(dob: date) -> str:
    """
    Root ID = [quarter letter][month-in-quarter][2 random digits][8 random digits]
    Only the quarter/month-in-quarter portion is derived from DOB, purely
    for lookup purposes. The remaining 10 digits are cryptographically
    random and carry the actual security of this identifier.
    """
    quarter_letters = ["A", "B", "C", "D"]
    quarter = quarter_letters[(dob.month - 1) // 3]
    month_in_quarter = str(((dob.month - 1) % 3) + 1)
    random_2 = f"{secrets.randbelow(100):02d}"
    random_8 = f"{secrets.randbelow(10**8):08d}"
    return f"{quarter}{month_in_quarter}{random_2}{random_8}"


# ---------------------------------------------------------------------
# Sub-ID DOB prefix (per the spec: [group letter][month position][hex day])
# ---------------------------------------------------------------------

_MONTH_GROUP = {
    1: "A", 2: "A", 3: "A", 4: "A",
    5: "B", 6: "B", 7: "B", 8: "B",
    9: "C", 10: "C", 11: "C", 12: "C",
}


def _month_position(month: int) -> int:
    """1-based position of the month within its group (1-4)."""
    return ((month - 1) % 4) + 1


def generate_subid_prefix(dob: date) -> str:
    """
    Deterministic 4-character prefix: [group][position][2-digit hex day]
    e.g. June 10 -> "B20A"
    Raises ValueError if dob is missing/invalid.
    """
    if dob is None:
        raise ValueError("DOB is required to generate a Sub-ID prefix.")
    group = _MONTH_GROUP[dob.month]
    position = _month_position(dob.month)
    hex_day = format(dob.day, "02X")
    return f"{group}{position}{hex_day}"


# ---------------------------------------------------------------------
# Sub-ID remainder — HMAC-derived, unique per (root_id, domain)
# ---------------------------------------------------------------------

def derive_subid_remainder(root_id: str, domain: str, length: int = 8) -> str:
    """
    Uses the root ID as an HMAC key and the domain name as the message.
    This is what makes each domain's sub-ID unlinkable from the others —
    knowing one sub-ID does not reveal any other, since HMAC output is
    computationally infeasible to reverse or correlate without the root_id.
    """
    digest = hmac.new(
        root_id.encode(), domain.encode(), hashlib.sha256
    ).hexdigest().upper()
    return digest[:length]


def generate_subid(root_id: str, domain: str, dob: date) -> str:
    """Full sub-ID = DOB-derived 4-char prefix + 8-char HMAC remainder."""
    prefix = generate_subid_prefix(dob)
    remainder = derive_subid_remainder(root_id, domain)
    return f"{prefix}{remainder}"


# ---------------------------------------------------------------------
# ECDSA signing for institution-issued records
# ---------------------------------------------------------------------

def generate_institution_keypair() -> tuple[bytes, bytes]:
    """Returns (private_key_pem, public_key_pem) for a new institution."""
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    priv_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    pub_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return priv_pem, pub_pem


def sign_content(private_key_pem: bytes, content: str) -> str:
    """Signs `content` with the institution's private key. Returns hex signature."""
    private_key = serialization.load_pem_private_key(private_key_pem, password=None)
    signature = private_key.sign(content.encode(), ec.ECDSA(hashes.SHA256()))
    return signature.hex()


def verify_signature(public_key_pem: bytes, content: str, signature_hex: str) -> bool:
    """Verifies a hex signature against `content` using the institution's public key."""
    try:
        public_key = serialization.load_pem_public_key(public_key_pem)
        public_key.verify(bytes.fromhex(signature_hex), content.encode(), ec.ECDSA(hashes.SHA256()))
        return True
    except (InvalidSignature, ValueError, TypeError):
        return False
