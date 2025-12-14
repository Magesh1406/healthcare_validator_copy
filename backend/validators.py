import requests

NPI_API = "https://npiregistry.cms.hhs.gov/api/?version=2.1"

def fetch_npi_data(npi):
    params = {
        "number": npi,
        "limit": 1
    }
    res = requests.get(NPI_API, params=params)
    if res.status_code != 200:
        return None

    data = res.json()
    results = data.get("results", [])
    return results[0] if results else None


def compare_fields(provider_row, npi_data):
    """Return dict of match/mismatch per field."""

    matches = {
        "name_match": False,
        "phone_match": False,
        "address_match": False
    }

    basic = npi_data.get("basic", {})
    name = basic.get("name") or basic.get("organization_name", "")

    # compare names
    matches["name_match"] = (
        provider_row["name"].strip().lower() in name.lower()
    )

    # compare phone
    npi_phone = npi_data["addresses"][0].get("telephone_number", "")
    matches["phone_match"] = provider_row["phone"] == npi_phone

    # compare address
    npi_addr = npi_data["addresses"][0].get("address_1", "")
    matches["address_match"] = provider_row["address_1"].lower().strip() in npi_addr.lower()

    return matches
