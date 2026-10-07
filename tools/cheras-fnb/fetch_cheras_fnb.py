#!/usr/bin/env python3
"""Download F&B shops around Cheras, Kuala Lumpur from OpenStreetMap (Overpass API) into a CSV.

Free, no API key, uses open data (ODbL). Coverage varies: many shops have a name and
address but not every one has a phone number or opening hours.

Usage:  python3 fetch_cheras_fnb.py [output.csv]
Change BBOX below to widen or narrow the search area.
"""
import csv
import json
import sys
import time
import urllib.parse
import urllib.request

# south, west, north, east  (roughly Cheras / Taman Connaught / Bandar Tun Hussein Onn / Batu 9)
BBOX = (3.06, 101.70, 3.13, 101.79)

FOOD_AMENITIES = "restaurant|cafe|fast_food|food_court|bar|pub|ice_cream|biergarten"
FOOD_SHOPS = "bakery|coffee|tea|confectionery|pastry|deli|butcher|seafood"

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

FIELDS = ["name", "type", "cuisine", "phone", "website", "email", "opening_hours",
          "housenumber", "street", "suburb", "city", "postcode", "lat", "lon", "osm_link"]


def build_query():
    s, w, n, e = BBOX
    box = f"({s},{w},{n},{e})"
    return f"""[out:json][timeout:90];
(
  nwr["amenity"~"^({FOOD_AMENITIES})$"]{box};
  nwr["shop"~"^({FOOD_SHOPS})$"]{box};
);
out center tags;"""


def fetch(query):
    data = urllib.parse.urlencode({"data": query}).encode()
    last_err = None
    for url in ENDPOINTS:
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, data=data, headers={"User-Agent": "cheras-fnb-list/1.0"})
                with urllib.request.urlopen(req, timeout=120) as r:
                    return json.load(r)
            except Exception as err:  # network / rate limit: wait and retry
                last_err = err
                time.sleep(5 * (attempt + 1))
    raise SystemExit(f"Could not reach the Overpass API: {last_err}")


def to_row(el):
    t = el.get("tags", {})
    lat = el.get("lat") or el.get("center", {}).get("lat")
    lon = el.get("lon") or el.get("center", {}).get("lon")
    return {
        "name": t.get("name", ""),
        "type": t.get("amenity") or t.get("shop", ""),
        "cuisine": t.get("cuisine", ""),
        "phone": t.get("phone") or t.get("contact:phone", ""),
        "website": t.get("website") or t.get("contact:website", ""),
        "email": t.get("email") or t.get("contact:email", ""),
        "opening_hours": t.get("opening_hours", ""),
        "housenumber": t.get("addr:housenumber", ""),
        "street": t.get("addr:street", ""),
        "suburb": t.get("addr:suburb", ""),
        "city": t.get("addr:city", ""),
        "postcode": t.get("addr:postcode", ""),
        "lat": lat, "lon": lon,
        "osm_link": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
    }


def main():
    csv_args = [a for a in sys.argv[1:] if a.endswith(".csv")]   # ignores notebook/Colab arguments
    out = csv_args[0] if csv_args else "cheras_fnb.csv"
    elements = fetch(build_query()).get("elements", [])
    rows = [to_row(el) for el in elements]
    rows = [r for r in rows if r["name"]]          # drop unnamed entries
    rows.sort(key=lambda r: (r["type"], r["name"].lower()))
    with open(out, "w", newline="", encoding="utf-8-sig") as f:   # utf-8-sig so Excel opens it cleanly
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)
    print(f"Saved {len(rows)} F&B places to {out}")


if __name__ == "__main__":
    main()
