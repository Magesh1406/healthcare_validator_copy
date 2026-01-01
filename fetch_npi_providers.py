import requests
import pandas as pd
import time

API_URL = "https://npiregistry.cms.hhs.gov/api/?version=2.1"

# Main states to fetch from
PRIMARY_STATES = ["CA", "TX", "FL", "NY", "IL", "PA"]

# Backup states (only used if needed)
FALLBACK_STATES = ["GA", "NC", "OH", "MI", "AZ", "WA"]

# Main taxonomy descriptions
PRIMARY_TAXONOMIES = [
    "Family Medicine",
    "Internal Medicine",
    "Nurse Practitioner",
]

# Backup taxonomy descriptions
FALLBACK_TAXONOMIES = [
    "Dentist",
    "Chiropractor",
    "Physician Assistant",
    "Emergency Medicine",
]


def fetch_until_200():
    """Fetch until we collect 200 valid (non-null name) provider records."""

    providers = []
    all_states = PRIMARY_STATES + FALLBACK_STATES
    all_taxonomies = PRIMARY_TAXONOMIES + FALLBACK_TAXONOMIES

    for state in all_states:
        for taxonomy_desc in all_taxonomies:

            params = {
                "state": state,
                "taxonomy_description": taxonomy_desc,
                "limit": 50,
                "pretty": "off"
            }

            print(f"Query → State={state}, Taxonomy={taxonomy_desc}")
            res = requests.get(API_URL, params=params)

            if res.status_code != 200:
                print("Request failed:", res.text)
                continue

            data = res.json()
            results = data.get("results", [])
            print(f"  Returned: {len(results)} providers")

            providers.extend(results)
            time.sleep(0.25)  # avoid hitting rate limit

            # Stop early when raw results are > 260 (after cleanup = ~200)
            if len(providers) >= 260:
                return providers

    return providers


def extract_provider_record(p):
    """Extract data for Individuals & Organizations."""

    basic = p.get("basic", {})
    addresses = p.get("addresses", [])
    addr = addresses[0] if len(addresses) > 0 else {}

    # FIXED: Enumeration type MUST come from TOP level
    enumeration_type = p.get("enumeration_type", "")

    # FIXED: Correct name extraction
    name = (
        basic.get("name") or
        basic.get("organization_name") or
        ""
    )

    # Skip NULL names
    if not name.strip():
        return None

    taxonomy = ""
    if p.get("taxonomies"):
        taxonomy = p["taxonomies"][0].get("desc", "")

    return {
        "name": name,
        "enumeration_type": enumeration_type,
        "npi": p.get("number", ""),
        "taxonomy": taxonomy,
        "phone": addr.get("telephone_number", ""),
        "address_1": addr.get("address_1", ""),
        "city": addr.get("city", ""),
        "state": addr.get("state", ""),
        "postal_code": addr.get("postal_code", "")
    }


def save_clean_200(providers, filename="providers_200.csv"):
    """Filter NULL names + stop exactly at 200 clean providers."""

    cleaned = []

    for p in providers:
        record = extract_provider_record(p)
        if record:
            cleaned.append(record)

        if len(cleaned) == 200:
            break

    df = pd.DataFrame(cleaned)
    df.to_csv(filename, index=False)

    print(f"\nSaved EXACTLY {len(cleaned)} providers → {filename}")


if __name__ == "__main__":
    print("Fetching providers until 200 valid rows are collected...")
    raw_providers = fetch_until_200()

    if not raw_providers:
        print("ERROR: No providers returned!")
    else:
        save_clean_200(raw_providers)
