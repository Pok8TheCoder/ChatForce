#!/usr/bin/env python3
"""Run the InsightForge FastAPI server."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "apps" / "api"))
sys.path.insert(0, str(ROOT / "packages" / "analysis-engine"))

import uvicorn

from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
        reload_dirs=[str(ROOT / "apps" / "api"), str(ROOT / "packages" / "analysis-engine")],
    )
