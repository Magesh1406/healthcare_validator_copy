import requests

NPI_API = "https://npiregistry.cms.hhs.gov/api/?version=2.1"

def fetch_authoritative_npi(npi: str):
    res = requests.get(NPI_API, params={"number": npi, "limit": 1})
    if res.status_code != 200:
        return None

    results = res.json().get("results", [])
    if not results:
        return None

    addr = results[0]["addresses"][0]

    return {
        "phone": addr.get("telephone_number"),
        "address_1": addr.get("address_1"),
        "city": addr.get("city"),
        "state": addr.get("state"),
        "postal_code": addr.get("postal_code"),
        "confidence": 0.95
    }
