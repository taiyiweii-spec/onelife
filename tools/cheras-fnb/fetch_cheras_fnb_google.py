#!/usr/bin/env python3
"""Download F&B places around Cheras, Kuala Lumpur from the official Google Places API into a CSV.

Setup (once):
  1. Google Cloud console -> create a project and turn on billing.
  2. Enable "Places API (New)".
  3. Create an API key (restrict it to Places API (New)).
  4. Put the key in an environment variable. Never paste it into chat or commit it:
       export GOOGLE_MAPS_API_KEY="your-key"        (Mac/Linux)
       setx GOOGLE_MAPS_API_KEY "your-key"          (Windows, then reopen the terminal)

Run:  python3 fetch_cheras_fnb_google.py [output.csv]

Cost: Text Search with phone, website, rating and hours is billed at Google's higher
"Enterprise" rate per request. This script prints how many requests it makes. Check the current
price and set a budget alert in Google Cloud before a big run. Use --dry-run to see the plan
without spending anything.
"""
import csv
import json
import os
import sys
import time
import urllib.request

# south, west, north, east  (Cheras / Taman Connaught / Bandar Tun Hussein Onn / Batu 9)
BBOX = (3.06, 101.70, 3.13, 101.79)
GRID = 3  # split the box into GRID x GRID cells, because Google returns at most 60 results per search

QUERIES = ["restaurant", "cafe", "bakery", "fast food", "food court", "bar", "dessert shop", "coffee shop"]

URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = ",".join([
    "nextPageToken",
    "places.id", "places.displayName", "places.formattedAddress", "places.primaryType",
    "places.types", "places.nationalPhoneNumber", "places.internationalPhoneNumber",
    "places.websiteUri", "places.rating", "places.userRatingCount", "places.priceLevel",
    "places.regularOpeningHours.weekdayDescriptions", "places.businessStatus",
    "places.googleMapsUri", "places.location",
])
FIELDS = ["name", "primary_type", "address", "phone", "website", "rating", "review_count",
          "price_level", "opening_hours", "status", "lat", "lon", "google_maps_link", "place_id"]


def cells():
    s, w, n, e = BBOX
    for i in range(GRID):
        for j in range(GRID):
            yield (s + (n - s) * i / GRID, w + (e - w) * j / GRID,
                   s + (n - s) * (i + 1) / GRID, w + (e - w) * (j + 1) / GRID)


def search(key, query, cell):
    low_lat, low_lon, high_lat, high_lon = cell
    token, results = None, []
    for _ in range(3):  # up to 3 pages x 20 = 60 results per query and cell
        body = {"textQuery": f"{query} in Cheras", "pageSize": 20,
                "locationRestriction": {"rectangle": {
                    "low": {"latitude": low_lat, "longitude": low_lon},
                    "high": {"latitude": high_lat, "longitude": high_lon}}}}
        if token:
            body["pageToken"] = token
        req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={
            "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = json.load(r)
        except urllib.error.HTTPError as err:
            raise SystemExit(f"Google API error {err.code}: {err.read().decode()[:500]}")
        results += data.get("places", [])
        token = data.get("nextPageToken")
        if not token:
            break
        time.sleep(2)  # the page token needs a moment to become valid
    return results


def to_row(p):
    loc = p.get("location", {})
    return {
        "name": p.get("displayName", {}).get("text", ""),
        "primary_type": p.get("primaryType", ""),
        "address": p.get("formattedAddress", ""),
        "phone": p.get("nationalPhoneNumber") or p.get("internationalPhoneNumber", ""),
        "website": p.get("websiteUri", ""),
        "rating": p.get("rating", ""),
        "review_count": p.get("userRatingCount", ""),
        "price_level": p.get("priceLevel", ""),
        "opening_hours": " | ".join(p.get("regularOpeningHours", {}).get("weekdayDescriptions", [])),
        "status": p.get("businessStatus", ""),
        "lat": loc.get("latitude", ""), "lon": loc.get("longitude", ""),
        "google_maps_link": p.get("googleMapsUri", ""),
        "place_id": p.get("id", ""),
    }


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    out = args[0] if args else "cheras_fnb_google.csv"
    plan = [(q, c) for q in QUERIES for c in cells()]
    print(f"Plan: {len(plan)} searches (each may use up to 3 requests = up to {len(plan) * 3} requests)")
    if dry:
        return
    key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not key:
        raise SystemExit("Set the GOOGLE_MAPS_API_KEY environment variable first (see the top of this file).")

    found, requests_used = {}, 0
    for n, (q, cell) in enumerate(plan, 1):
        for p in search(key, q, cell):
            found.setdefault(p["id"], p)          # de-duplicate by place id
        print(f"[{n}/{len(plan)}] {q}: {len(found)} unique places so far")

    rows = sorted((to_row(p) for p in found.values()), key=lambda r: (r["primary_type"], r["name"].lower()))
    with open(out, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)
    print(f"Saved {len(rows)} places to {out}")


if __name__ == "__main__":
    main()
