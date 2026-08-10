"""Shared fixtures: sample requests and valid LLM response payloads."""

VALID_BANANA_ASSESSMENT_RESPONSE = {
    "produce": "banana",
    "condition": {
        "visual_class": "freshbanana",
        "freshness_score": 82,
        "cv_confidence": 0.94,
        "batch_condition": "GOOD",
    },
    "assessment": {
        "estimated_remaining_shelf_life_days": 2.5,
        "estimate_range_days": [1.8, 3.2],
        "spoilage_risk": "MEDIUM",
        "confidence": 0.68,
        "urgency": "MEDIUM",
    },
    "factors": [
        {
            "factor": "temperature",
            "impact": "negative",
            "explanation": "Storage temperature of 8C is below the 13-14C optimal range for banana, "
                           "risking chilling injury which shortens shelf life.",
        },
        {
            "factor": "humidity",
            "impact": "positive",
            "explanation": "72% humidity is within a reasonable range to limit moisture loss, "
                           "though below the 85-95% ideal.",
        },
    ],
    "missing_information": [],
    "reasoning_summary": "The batch shows good visual freshness but was stored below the recommended "
                         "banana storage temperature, which increases chilling injury risk and "
                         "shortens the safe remaining window.",
    "data_quality": "GOOD",
    "evidence": [
        {
            "source": "UC Davis Postharvest Research and Extension Center - Banana (Cavendish) Fact Sheet",
            "title": "Banana Storage Conditions",
            "key_information": "Optimal banana storage is 13-14C at 90-95% RH for green/turning fruit.",
            "relevance": "Directly informs the temperature risk factor.",
        }
    ],
}

INSUFFICIENT_DATA_RESPONSE = {
    "produce": "banana",
    "condition": {
        "visual_class": "freshbanana",
        "freshness_score": 82,
        "cv_confidence": 0.94,
        "batch_condition": "GOOD",
    },
    "assessment": {
        "estimated_remaining_shelf_life_days": None,
        "estimate_range_days": None,
        "spoilage_risk": "UNKNOWN",
        "confidence": 0.0,
        "urgency": "UNKNOWN",
    },
    "factors": [],
    "missing_information": ["temperature_c", "humidity_percent", "harvest_age_days"],
    "reasoning_summary": "No storage temperature, humidity, or harvest age was provided, and no "
                         "produce-specific evidence was retrieved. A meaningful shelf-life estimate "
                         "cannot be produced from visual condition alone.",
    "data_quality": "INSUFFICIENT",
    "evidence": [],
}


def sample_cv_analysis(**overrides):
    base = {
        "visual_class": "freshbanana",
        "freshness_score": 82,
        "confidence": 0.94,
        "class_distribution": {"freshbanana": 0.8, "rottenbanana": 0.2},
        "high_disagreement": False,
    }
    base.update(overrides)
    return base


def sample_request(**overrides):
    base = {
        "produce": "banana",
        "batch_size_kg": 500,
        "cv_analysis": sample_cv_analysis(),
        "storage": {
            "harvest_age_days": 3,
            "temperature_c": 8,
            "humidity_percent": 72,
            "storage_duration_hours": 24,
            "transport_duration_hours": 7,
            "storage_type": "cold_storage",
        },
    }
    base.update(overrides)
    return base
