"""
CertClerk — LLM Client.

Structured, validated calls to any OpenAI-compatible endpoint.
Supports runtime configuration for Google Gemini, Groq, Ollama, etc.
Returns None if the LLM is unconfigured → caller falls back to rules.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

# Load .env file automatically at startup
load_dotenv(override=True)

# In-memory runtime configuration (initialized from environment variables)
_runtime_config: dict[str, str] = {
    "base_url": os.getenv("LLM_BASE_URL", "").strip(),
    "api_key": os.getenv("LLM_API_KEY", "").strip(),
    "model": os.getenv("LLM_MODEL", "").strip(),
}


def detect_provider(base_url: str) -> str:
    """Identify the provider name based on the base_url."""
    url = (base_url or "").lower()
    if "googleapis.com" in url or "google" in url:
        return "Google Gemini"
    if "groq.com" in url or "groq" in url:
        return "Groq"
    if "openrouter.ai" in url:
        return "OpenRouter"
    if "localhost:11434" in url or "127.0.0.1:11434" in url:
        return "Ollama (Local)"
    if "api.openai.com" in url:
        return "OpenAI"
    if not url:
        return "None (Rules Only)"
    return "Custom Provider"


def get_llm_status() -> dict:
    """Return the current active LLM configuration status."""
    base_url = _runtime_config["base_url"] or os.getenv("LLM_BASE_URL", "")
    api_key = _runtime_config["api_key"] or os.getenv("LLM_API_KEY", "")
    model = _runtime_config["model"] or os.getenv("LLM_MODEL", "")

    is_local = "localhost" in base_url or "127.0.0.1" in base_url
    configured = bool(base_url and (api_key or is_local))

    masked_key = ""
    if api_key:
        if len(api_key) > 8:
            masked_key = f"{api_key[:4]}...{api_key[-4:]}"
        else:
            masked_key = "****"

    return {
        "configured": configured,
        "provider": detect_provider(base_url),
        "base_url": base_url,
        "model": model,
        "has_key": bool(api_key),
        "masked_key": masked_key,
    }


def set_llm_config(
    base_url: str,
    api_key: str,
    model: str,
    persist_env: bool = True,
) -> dict:
    """
    Update LLM configuration dynamically at runtime.
    Optionally persists to .env file on disk with atomic replacement.
    """
    cleaned_key = api_key.strip().strip("'\"")
    cleaned_url = base_url.strip().strip("'\"")
    cleaned_model = model.strip().strip("'\"")

    # If key is empty but we already have an active key and user is updating URL/model without wiping
    if not cleaned_key and cleaned_url and _runtime_config.get("api_key"):
        cleaned_key = _runtime_config["api_key"]

    _runtime_config["base_url"] = cleaned_url
    _runtime_config["api_key"] = cleaned_key
    _runtime_config["model"] = cleaned_model

    # Also update current process environment
    os.environ["LLM_BASE_URL"] = cleaned_url
    os.environ["LLM_API_KEY"] = cleaned_key
    os.environ["LLM_MODEL"] = cleaned_model

    if persist_env:
        try:
            env_path = Path(".env")
            lines: list[str] = []
            if env_path.exists():
                lines = env_path.read_text(encoding="utf-8").splitlines()

            updates = {
                "LLM_BASE_URL": cleaned_url,
                "LLM_API_KEY": cleaned_key,
                "LLM_MODEL": cleaned_model,
            }
            seen_keys = set()
            new_lines = []

            for line in lines:
                matched = False
                for k, v in updates.items():
                    if line.startswith(f"{k}=") or line == k:
                        new_lines.append(f"{k}={v}")
                        seen_keys.add(k)
                        matched = True
                        break
                if not matched:
                    new_lines.append(line)

            for k, v in updates.items():
                if k not in seen_keys:
                    new_lines.append(f"{k}={v}")

            content = "\n".join(new_lines).strip() + "\n"
            tmp_env = Path(".env.tmp")
            tmp_env.write_text(content, encoding="utf-8")

            # Robust atomic replacement with Windows file-lock retry
            for attempt in range(8):
                try:
                    os.replace(str(tmp_env), str(env_path))
                    break
                except (PermissionError, OSError):
                    if attempt == 7:
                        import shutil
                        shutil.copyfile(str(tmp_env), str(env_path))
                        if tmp_env.exists():
                            try:
                                tmp_env.unlink()
                            except Exception:
                                pass
                        break
                    time.sleep(0.05 * (attempt + 1))
        except Exception as e:
            logger.warning("Could not persist to .env file: %s", e)

    return get_llm_status()


def _client(
    base_url: str | None = None,
    api_key: str | None = None,
    timeout: float = 30.0,
    max_retries: int = 2,
):
    """Create an OpenAI client if configured, else return None."""
    b_url = base_url or _runtime_config["base_url"] or os.getenv("LLM_BASE_URL")
    a_key = api_key or _runtime_config["api_key"] or os.getenv("LLM_API_KEY", "none")
    if not b_url:
        return None
    try:
        from openai import OpenAI
        return OpenAI(
            base_url=b_url,
            api_key=a_key if a_key else "none",
            timeout=timeout,
            max_retries=max_retries,
        )
    except Exception as e:
        logger.warning("Failed to create LLM client: %s", e)
        return None


def test_llm_connection(
    base_url: str | None = None,
    api_key: str | None = None,
    model: str | None = None,
) -> dict:
    """
    Test connectivity to an LLM provider.
    Returns {"ok": True, "latency_ms": int, "provider": str} or {"ok": False, "error": str}.
    """
    b_url = (base_url.strip() if base_url and base_url.strip() else _runtime_config["base_url"]) or os.getenv("LLM_BASE_URL", "")
    a_key = (api_key.strip() if api_key and api_key.strip() else _runtime_config["api_key"]) or os.getenv("LLM_API_KEY", "")
    m_name = (model.strip() if model and model.strip() else _runtime_config["model"]) or os.getenv("LLM_MODEL", "")

    if not b_url:
        return {"ok": False, "error": "Base URL is required."}

    c = _client(base_url=b_url, api_key=a_key, timeout=12.0, max_retries=1)
    if c is None:
        return {"ok": False, "error": "Could not initialize LLM client library."}

    start = time.time()
    try:
        res = c.chat.completions.create(
            model=m_name or "gemini-3.6-flash",
            messages=[{"role": "user", "content": "Respond with 'ok'"}],
            max_tokens=10,
            temperature=0,
        )
        latency = int((time.time() - start) * 1000)
        content = res.choices[0].message.content or ""
        return {
            "ok": True,
            "latency_ms": latency,
            "provider": detect_provider(b_url),
            "model": m_name,
            "response": content.strip()[:50],
        }
    except Exception as e:
        logger.warning("LLM test failed: %s", e)
        # Extract inner error message from OpenAI APIError body if available
        details = ""
        body = getattr(e, "body", None)
        if isinstance(body, list) and body and isinstance(body[0], dict):
            details = body[0].get("error", {}).get("message", "")
        elif isinstance(body, dict):
            details = body.get("error", {}).get("message", "")

        err_msg = details or str(e)
        err_lower = err_msg.lower()
        status_code = getattr(e, "status_code", None)

        if (
            status_code == 401
            or (status_code == 400 and ("valid api key" in err_lower or "api_key" in err_lower))
            or "invalid_api_key" in err_lower
            or "valid api key" in err_lower
            or "api_key_invalid" in err_lower
        ):
            err_msg = "Invalid API Key. Please verify the key you entered from your provider console."
        elif status_code == 429 or "resource_exhausted" in err_lower or "quota" in err_lower:
            err_msg = "Rate limit or quota reached. Please check your provider quota limits."
        elif status_code == 404 or "model_not_found" in err_lower:
            err_msg = f"Model '{m_name}' not found for this provider endpoint."
        elif "timeout" in err_lower or "timed out" in err_lower:
            err_msg = "Connection timed out. The provider may be busy. Please try again."
        elif "connection error" in err_lower or "failed to connect" in err_lower:
            err_msg = "Failed to connect to provider. Check your network or base URL."
        return {"ok": False, "error": err_msg}


def chat_json(
    system: str,
    user: str,
    schema: type[BaseModel],
    retries: int = 2,
) -> BaseModel | None:
    """
    Call the LLM and parse its response as a Pydantic model.
    Returns the validated model or None (caller should fall back to rules).
    """
    c = _client()
    if c is None:
        return None

    model = _runtime_config["model"] or os.getenv("LLM_MODEL", "gpt-3.5-turbo")

    for attempt in range(retries + 1):
        try:
            response = c.chat.completions.create(
                model=model,
                temperature=0,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
            text = response.choices[0].message.content
            if not text:
                continue

            # Extract JSON from response (handle markdown wrapping e.g. ```json ... ```)
            json_start = text.find("{")
            json_end = text.rfind("}") + 1
            if json_start < 0 or json_end <= json_start:
                continue

            json_str = text[json_start:json_end]
            return schema.model_validate_json(json_str)

        except (ValidationError, ValueError, KeyError, json.JSONDecodeError) as e:
            logger.debug("LLM response invalid (attempt %d): %s", attempt + 1, e)
            continue

        except Exception as e:
            logger.warning("LLM call failed (attempt %d): %s", attempt + 1, e)
            if attempt < retries:
                time.sleep(2 ** attempt)

    return None
