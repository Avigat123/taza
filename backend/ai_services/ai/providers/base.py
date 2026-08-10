"""
TAZA AI Service - AI provider abstraction.

Every provider exposes the same interface: generate_json(system_prompt,
user_prompt) -> raw string expected to be JSON. Parsing/validation happens
one layer up (in shelf_life/assessment.py), not inside providers, so
providers stay swappable without touching validation logic.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ProviderResponse:
    raw_text: str
    provider_name: str
    model_name: str
    latency_seconds: float


class AIProvider(ABC):
    """Common interface all providers implement."""

    provider_name: str = "base"

    @abstractmethod
    def generate_json(self, system_prompt: str, user_prompt: str) -> ProviderResponse:
        """
        Send system+user prompt to the model and return its raw text response.
        Implementations should request JSON output where the provider supports
        it natively, but the caller MUST still parse/validate defensively -
        never assume the string is valid JSON.
        """
        raise NotImplementedError


class ProviderError(Exception):
    """Raised when a provider call fails (network, auth, timeout, etc)."""
    pass
