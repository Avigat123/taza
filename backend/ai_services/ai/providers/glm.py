"""
FreshFlow OS - GLM provider (Zhipu AI, has a free tier; OpenAI-compatible API shape).

Requires GLM_API_KEY environment variable.
"""
import os
import time

import requests

from ai.providers.base import AIProvider, ProviderResponse, ProviderError


class GLMProvider(AIProvider):
    provider_name = "glm"

    def __init__(self, model: str = None, api_key: str = None, base_url: str = None, timeout: int = 60):
        self.model = model or os.environ.get("GLM_MODEL", "glm-4-flash")
        self.api_key = api_key or os.environ.get("GLM_API_KEY")
        self.base_url = base_url or os.environ.get(
            "GLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        )
        self.timeout = timeout
        if not self.api_key:
            raise ProviderError(
                "GLM_API_KEY not set. Set it as an environment variable "
                "(never hard-code it in source)."
            )

    def generate_json(self, system_prompt: str, user_prompt: str) -> ProviderResponse:
        t0 = time.time()
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        }
        try:
            resp = requests.post(self.base_url, headers=headers, json=payload, timeout=self.timeout)
            resp.raise_for_status()
        except requests.RequestException as e:
            raise ProviderError(f"GLM request failed: {e}") from e

        data = resp.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise ProviderError(f"Unexpected GLM response shape: {data}") from e

        latency = time.time() - t0
        return ProviderResponse(
            raw_text=content,
            provider_name=self.provider_name,
            model_name=self.model,
            latency_seconds=latency,
        )
