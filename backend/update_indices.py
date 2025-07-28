#!/usr/bin/env python3
import os
import sys
import csv
import json
import time
import requests

# ─── Configuration ────────────────────────────────────────────────
APP_ID      = os.getenv("ALGOLIA_APP_ID")
API_KEY     = os.getenv("ALGOLIA_ADMIN_KEY")
# Webhook URL and optional Bearer token for n8n
N8N_WEBHOOK = os.getenv("N8N_FIRE_WEBHOOK_URL")   # e.g., http://n8n:5678/webhook/fire-severity
N8N_TOKEN   = os.getenv("N8N_FIRE_WEBHOOK_TOKEN") # your secret bearer token (optional)
AIRNOW_KEY  = os.getenv("AIRNOW_API_KEY")
DSN_HOST    = f"https://{APP_ID}-dsn.algolia.net"

if not APP_ID or not API_KEY:
    print("⛔ Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_KEY", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "X-Algolia-API-Key":        API_KEY,
    "X-Algolia-Application-Id": APP_ID,
    "Content-Type":             "application/json",
}

# ─── Helper: wait for a batch task to complete ───────────────────
def wait_task(index, task_id):
    url = f"{DSN_HOST}/1/indexes/{index}/task/{task_id}"
    while True:
        r = requests.get(url, headers=HEADERS)
        r.raise_for_status()
        if r.json().get("status") == "published":
            break
        time.sleep(0.2)

# ─── Helper: batch-index records via REST API ──────────────────
def index_records(index, records):
    if not records:
        print(f"⚠️  No records to index for '{index}'")
        return
    url = f"{DSN_HOST}/1/indexes/{index}/batch"
    body = {"requests": [{"action": "addObject", "body": rec} for rec in records]}
    r = requests.post(url, headers=HEADERS, json=body)
    r.raise_for_status()
    task_id = r.json().get("taskID")
    wait_task(index, task_id)
    print(f"✅ Indexed {len(records)} into '{index}' (task {task_id})")

# ─── Fetch 7-day MODIS & VIIRS fires (CSV) ───────────────────────
def fetch_fires():
    urls = [
        "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_7d.csv",
        "https://firms.modaps.eosdis.nasa.gov/data/active_fire/viirs-c2/csv/VIIRS_I_Global_7d.csv",
    ]
    recs = []
    for url in urls:
        try:
            resp = requests.get(url, timeout=20)
            resp.raise_for_status()
            reader = csv.DictReader(resp.text.splitlines())
        except Exception as e:
            print(f"❌ Error fetching {url}: {e}", file=sys.stderr)
            continue
        for row in reader:
            try:
                lat  = float(row.get("latitude", 0))
                lon  = float(row.get("longitude", 0))
                date = row.get("acq_date", "")
            except:
                continue
            recs.append({
                "objectID":  f"fire:{date}:{lat:.4f}:{lon:.4f}",
                "date":      date,
                "latitude":  lat,
                "longitude": lon,
                "confidence": row.get("confidence", ""),
            })
    return recs

# ─── Fetch shelters from FEMA Open Data API ─────────────────────
def fetch_shelters():
    url = "https://www.fema.gov/api/open/v1/ShelterLocations"
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        data = r.json().get("ShelterLocations", [])
    except Exception as e:
        print(f"❌ Error fetching FEMA shelters: {e}", file=sys.stderr)
        return []
    recs = []
    for s in data:
        lat = s.get("Latitude")
        lon = s.get("Longitude")
        if lat is None or lon is None:
            continue
        recs.append({
            "objectID":   f"shelter:fema:{s.get('ShelterName','').replace(' ','_')}",
            "name":       s.get("ShelterName"),
            "address":    s.get("Address"),
            "city":       s.get("City"),
            "state":      s.get("State"),
            "zip":        s.get("ZIP"),
            "latitude":   float(lat),
            "longitude":  float(lon),
            "capacity":   s.get("MaxCapacity"),
        })
    return recs

# ─── Fetch AQI (optional) ────────────────────────────────────────
def fetch_aqi():
    if not AIRNOW_KEY:
        print("⚠️  AIRNOW_API_KEY not set; skipping AQI", file=sys.stderr)
        return []
    today = time.strftime("%Y-%m-%d")
    url = (
        "https://www.airnowapi.org/aq/observation/zipCode/historical"
        f"?format=application/json&zipCode=90210&date={today}T00-0000&distance=25&API_KEY={AIRNOW_KEY}"
    )
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        print(f"❌ Error fetching AQI: {e}", file=sys.stderr)
        return []
    recs = []
    for e in data:
        recs.append({
            "objectID":      f"aqi:{e.get('DateObserved')}:{e.get('ReportingArea')}",
            "ReportingArea": e.get("ReportingArea"),
            "AQI":           e.get("AQI"),
            "ParameterName": e.get("ParameterName"),
            "latitude":      e.get("Latitude"),
            "longitude":     e.get("Longitude"),
        })
    return recs

# ─── Main ingestion & batch webhook push ─────────────────────────
def main():
    # Fire ingestion and indexing
    fires = fetch_fires()
    index_records("fires", fires)
    # Batch‐send all fires to n8n webhook (one HTTP call) with auth
    if N8N_WEBHOOK and fires:
        headers = {}
        if N8N_TOKEN:
            headers["Authorization"] = f"Bearer {N8N_TOKEN}"
        try:
            requests.post(N8N_WEBHOOK, json={"records": fires}, headers=headers, timeout=30)
        except Exception as e:
            print(f"⚠️ Webhook batch error: {e}")

    # Shelter ingestion and indexing
    shelters = fetch_shelters()
    index_records("shelters", shelters)

    # AQI ingestion
    aqi = fetch_aqi()
    index_records("aqi", aqi)

if __name__ == "__main__":
    main()
