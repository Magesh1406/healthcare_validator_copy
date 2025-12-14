def generate_corrections(row, authoritative):
    corrections = {}
    confidence = {}

    if not row["phone_match"]:
        corrections["phone"] = authoritative["phone"]
        confidence["phone"] = authoritative["confidence"]

    if not row["address_match"]:
        corrections["address_1"] = authoritative["address_1"]
        confidence["address_1"] = authoritative["confidence"]

    return corrections, confidence
