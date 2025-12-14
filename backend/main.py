from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import csv
import uuid
import os
import traceback

from backend.supabase_client import supabase
from backend.validators import fetch_npi_data, compare_fields




app = FastAPI()

# -------------------------------------------------
# CORS
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# HEALTH
# -------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

# -------------------------------------------------
# A. UPLOAD CSV + CREATE PROVIDERS + CREATE JOB
# -------------------------------------------------
@app.post("/providers/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())

    try:
        contents = (await file.read()).decode("utf-8").splitlines()
        reader = csv.DictReader(contents)

        providers_map = {}

        for row in reader:
            npi = row.get("npi")
            if not npi:
                continue

            providers_map[npi] = {
                "job_id": job_id,
                "name": row.get("name"),
                "enumeration_type": row.get("enumeration_type"),
                "npi": npi,
                "taxonomy": row.get("taxonomy"),
                "phone": row.get("phone"),
                "address_1": row.get("address_1"),
                "city": row.get("city"),
                "state": row.get("state"),
                "postal_code": row.get("postal_code")
            }

        providers = list(providers_map.values())

        supabase.table("providers").upsert(
            providers, on_conflict="npi"
        ).execute()

        supabase.table("validation_jobs").insert({
            "id": job_id,
            "status": "pending",
            "total_providers": len(providers),
            "processed_count": 0
        }).execute()

        return {"job_id": job_id, "count": len(providers)}

    except Exception as e:
        traceback.print_exc()
        raise e

# -------------------------------------------------
# B. VALIDATE PROVIDERS VIA NPI API
# -------------------------------------------------
@app.post("/providers/validate/{job_id}")
def validate_providers(job_id: str):
    resp = supabase.table("providers").select("*").eq("job_id", job_id).execute()
    provider_rows = resp.data

    completed = 0

    for p in provider_rows:
        npi_data = fetch_npi_data(p["npi"])

        if not npi_data:
            supabase.table("validation_results").insert({
                "provider_id": p["id"],
                "job_id": job_id,
                "field_name": "overall_validation",
                "name_match": False,
                "phone_match": False,
                "address_match": False,
                "raw_api_data": {}
            }).execute()
            continue

        matches = compare_fields(p, npi_data)

        supabase.table("validation_results").insert({
            "provider_id": p["id"],
            "job_id": job_id,
            "field_name": "overall_validation",
            **matches,
            "raw_api_data": npi_data
        }).execute()

        completed += 1

        supabase.table("validation_jobs").update({
            "processed_count": completed
        }).eq("id", job_id).execute()

    supabase.table("validation_jobs").update({
        "status": "completed"
    }).eq("id", job_id).execute()

    return {"job_id": job_id, "validated": completed}

# -------------------------------------------------
# 🆕 G. AUTO-CORRECT MISMATCHED PROVIDERS
# -------------------------------------------------
@app.post("/providers/correct/{job_id}")
def auto_correct(job_id: str):
    results = supabase.table("validation_results") \
        .select("*, providers(*)") \
        .eq("job_id", job_id) \
        .execute().data

    corrected = 0

    for r in results:
        provider = r["providers"]

        if r["phone_match"] and r["address_match"]:
            continue

        authoritative = fetch_authoritative_npi(provider["npi"])
        if not authoritative:
            continue

        corrections, confidence = generate_corrections(r, authoritative)

        if corrections:
            supabase.table("providers").update(corrections) \
                .eq("id", provider["id"]) \
                .execute()

            supabase.table("validation_results").update({
                "corrected_data": corrections,
                "confidence_scores": confidence,
                "status": "auto_corrected"
            }).eq("id", r["id"]).execute()

            corrected += 1

    return {"job_id": job_id, "auto_corrected": corrected}

# -------------------------------------------------
# C. GET VALIDATION RESULTS FOR A JOB
# -------------------------------------------------
@app.get("/providers/results/{job_id}")
def job_results(job_id: str):
    return supabase.table("validation_results") \
        .select("*") \
        .eq("job_id", job_id) \
        .execute().data

# -------------------------------------------------
# D. GET ALL PROVIDERS
# -------------------------------------------------
@app.get("/providers")
def list_providers():
    return supabase.table("providers").select("*").execute().data

# -------------------------------------------------
# E. GET SINGLE PROVIDER WITH RESULTS
# -------------------------------------------------
@app.get("/providers/{provider_id}")
def get_provider(provider_id: str):
    provider = supabase.table("providers").select("*").eq("id", provider_id).execute().data
    results = supabase.table("validation_results").select("*").eq("provider_id", provider_id).execute().data

    return {
        "provider": provider[0] if provider else None,
        "results": results
    }

# -------------------------------------------------
# F. GET JOB STATUS
# -------------------------------------------------
@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    job = supabase.table("validation_jobs").select("*").eq("id", job_id).execute()
    return job.data[0] if job.data else None

# -------------------------------------------------
# FRONTEND STATIC FILE SERVING
# -------------------------------------------------
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith(("providers", "jobs", "health", "assets")):
            return {"error": "Not found"}

        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Frontend not built"}
