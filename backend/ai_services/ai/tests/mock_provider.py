"""Deterministic mock provider for tests - no network/LLM calls."""
import json
from typing import Callable, Optional

from ai.providers.base import AIProvider, ProviderResponse, ProviderError


class MockProvider(AIProvider):
    provider_name = "mock"

    def __init__(self, response_fn: Optional[Callable[[str, str], str]] = None, fixed_response: Optional[dict] = None):
        """
        Either supply `response_fn(system_prompt, user_prompt) -> raw_text_str`
        for custom logic per test, or `fixed_response` (a dict) to always
        return the same JSON.
        """
        self.model = "mock-model"
        self.response_fn = response_fn
        self.fixed_response = fixed_response
        self.call_count = 0
        self.last_system_prompt = None
        self.last_user_prompt = None

    def generate_json(self, system_prompt: str, user_prompt: str) -> ProviderResponse:
        self.call_count += 1
        self.last_system_prompt = system_prompt
        self.last_user_prompt = user_prompt

        if self.response_fn:
            raw_text = self.response_fn(system_prompt, user_prompt)
        elif self.fixed_response is not None:
            raw_text = json.dumps(self.fixed_response)
        else:
            raise ProviderError("MockProvider has no response configured")

        return ProviderResponse(
            raw_text=raw_text,
            provider_name=self.provider_name,
            model_name=self.model,
            latency_seconds=0.01,
        )
