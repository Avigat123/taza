"""
TAZA AI Service - Provider factory.

Reads AI_PROVIDER env var ("ollama" | "gemini" | "glm") and constructs the
right provider. This is the ONLY place that should branch on provider name -
everywhere else in the codebase talks to the AIProvider interface.
"""
import os

from ai.providers.base import AIProvider, ProviderError
from ai.providers.ollama import OllamaProvider
from ai.providers.gemini import GeminiProvider
from ai.providers.glm import GLMProvider

_PROVIDERS = {
    "ollama": OllamaProvider,
    "gemini": GeminiProvider,
    "glm": GLMProvider,
}


def get_provider(provider_name: str = None) -> AIProvider:
    name = (provider_name or os.environ.get("AI_PROVIDER", "ollama")).strip().lower()
    if name not in _PROVIDERS:
        raise ProviderError(
            f"Unknown AI_PROVIDER '{name}'. Supported: {sorted(_PROVIDERS.keys())}"
        )
    return _PROVIDERS[name]()
