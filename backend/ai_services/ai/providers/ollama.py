"""
TAZA AI Service - Ollama provider (local, free, no API key required).

Preferred default for hackathon use: no cost, no rate limits, works offline
once the model is pulled (e.g. `ollama pull qwen2.5:7b` or `ollama pull gemma2:9b`).
"""
import os
import time

import requests

from ai.providers.base import AIProvider, ProviderResponse, ProviderError


class OllamaProvider(AIProvider):
    provider_name = "ollama"

    def __init__(self, model: str = None, base_url: str = None, timeout: int = 60):
        self.model = model or os.environ.get("OLLAMA_MODEL", "qwen2.5:7b")
        self.base_url = base_url or os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        self.timeout = timeout

    def generate_json(self, system_prompt: str, user_prompt: str) -> ProviderResponse:
        t0 = time.time()
        try:
            resp = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "format": "json",  # Ollama native JSON-mode support
                    "stream": False,
                    "options": {"temperature": 0.1},
                },
                timeout=self.timeout,
            )
            resp.raise_for_status()
        except requests.RequestException as e:
            raise ProviderError(f"Ollama request failed: {e}") from e

        data = resp.json()
        content = data.get("message", {}).get("content", "")
        latency = time.time() - t0

        return ProviderResponse(
            raw_text=content,
            provider_name=self.provider_name,
            model_name=self.model,
            latency_seconds=latency,
        )
