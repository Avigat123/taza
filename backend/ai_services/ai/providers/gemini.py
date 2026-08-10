"""
TAZA AI Service - Google Gemini provider (free tier).

Requires GEMINI_API_KEY environment variable. Never hard-code the key.
Uses Gemini's native JSON response mode where available.
"""
import os
import time

import requests

from ai.providers.base import AIProvider, ProviderResponse, ProviderError


class GeminiProvider(AIProvider):
    provider_name = "gemini"

    def __init__(self, model: str = None, api_key: str = None, timeout: int = 60):
        self.model = model or os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.timeout = timeout
        if not self.api_key:
            raise ProviderError(
                "GEMINI_API_KEY not set. Set it as an environment variable "
                "(never hard-code it in source)."
            )

    def generate_json(self, system_prompt: str, user_prompt: str) -> ProviderResponse:
        t0 = time.time()
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
        }
        try:
            resp = requests.post(url, json=payload, timeout=self.timeout)
            resp.raise_for_status()
        except requests.RequestException as e:
            raise ProviderError(f"Gemini request failed: {e}") from e

        data = resp.json()
        try:
            content = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            raise ProviderError(f"Unexpected Gemini response shape: {data}") from e

        latency = time.time() - t0
        return ProviderResponse(
            raw_text=content,
            provider_name=self.provider_name,
            model_name=self.model,
            latency_seconds=latency,
        )
