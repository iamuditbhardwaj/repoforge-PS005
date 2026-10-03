import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.environ["SUPABASE_URL"]
# Use the SERVICE ROLE key here, never the anon/public key — this backend
# needs to bypass row-level security to write records on institutions'
# behalf. NEVER expose the service role key to Lovable/the frontend;
# it lives only in this backend's environment variables.
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
