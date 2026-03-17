# ShareNest — Location data scripts

Scripts to process and import Spain cities & neighbourhoods into Supabase.

## Data source
OpenStreetMap data for Spain, processed into cities + places (barrios/zonas).

## Directory structure

```
scripts/
  data/
    geojson/          ← raw OSM GeoJSON files (copy from HomiMatchApp if needed)
      spain-cities-areas.geojson
      spain-places.geojson
    exports/          ← processed JSON (ready to import)
      cities.filtered.json       ← cities that have at least 1 place
      places_by_city.best.json   ← deduplicated places by city
  extract_geojson.py      ← step 1: extract cities + areas from GeoJSON
  extract_places.py       ← step 2: extract places (barrios, zonas) from GeoJSON
  filter_cities_by_places.py  ← step 3: filter cities to only those with places
  choose_best_places_filter.py ← step 4: deduplicate places by quality score
  import_locations.py     ← step 5: import into Supabase
```

## Quick start (data already processed)

The `data/exports/` directory already contains ready-to-import files.
Just run:

```bash
cd scripts
pip install requests python-dotenv

# Set your Supabase credentials
export SUPABASE_URL="https://iuzmjhndaapftnxasdyc.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

python import_locations.py
```

## Full pipeline (re-process from raw GeoJSON)

Only needed if you want to update the data.

```bash
pip install shapely requests python-dotenv

# Copy GeoJSON files from HomiMatchApp:
# cp C:\Users\peorr\Desktop\HomiMatchApp\data\geojson\* data/geojson/

python extract_geojson.py        # → cities.json, areas_by_city.json
python extract_places.py         # → places_by_city.json
python filter_cities_by_places.py # → cities.filtered.json
python choose_best_places_filter.py # → places_by_city.best.json
python import_locations.py       # → uploads to Supabase
```

## Tables populated

- `cities` — ~500 Spanish municipalities
- `city_places` — ~13,000 barrios/zonas/suburbs linked to their city
