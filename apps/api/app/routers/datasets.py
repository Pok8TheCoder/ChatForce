from __future__ import annotations

import re
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import settings
from app.services.storage import StorageService

router = APIRouter(prefix="/api/datasets", tags=["datasets"])
storage = StorageService()

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".parquet"}
SAFE_FILENAME = re.compile(r"[^a-zA-Z0-9._-]+")


@router.post("")
async def upload_dataset(
    file: UploadFile = File(...),
    workspace_id: str = Form(...),
    object_id: str | None = Form(None),
) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=400, detail="File too large")

    safe_name = SAFE_FILENAME.sub("_", Path(file.filename).name)
    dataset_id = object_id or safe_name.rsplit(".", 1)[0]
    dest_dir = storage.dataset_original_dir(workspace_id, dataset_id)
    dest_path = dest_dir / safe_name
    dest_path.write_bytes(content)

    profile = _quick_profile(dest_path, ext)

    return {
        "dataset_id": dataset_id,
        "filename": safe_name,
        "workspace_id": workspace_id,
        "size_bytes": len(content),
        "profile": profile,
    }


@router.get("/{dataset_id}/profile")
def get_dataset_profile(dataset_id: str, workspace_id: str) -> dict:
    original_dir = storage.dataset_original_dir(workspace_id, dataset_id)
    files = list(original_dir.glob("*"))
    if not files:
        raise HTTPException(status_code=404, detail="Dataset not found")
    file_path = files[0]
    ext = file_path.suffix.lower()
    return _quick_profile(file_path, ext)


def _quick_profile(path: Path, ext: str) -> dict:
    import polars as pl

    try:
        if ext == ".csv":
            df = pl.read_csv(path, infer_schema_length=1000)
        elif ext in {".xlsx", ".xls"}:
            df = pl.read_excel(path)
        elif ext == ".parquet":
            df = pl.read_parquet(path)
        else:
            return {"error": "unsupported"}
    except Exception as exc:
        return {"error": str(exc), "rows": 0, "columns": 0}

    cols = df.columns
    dtypes: dict[str, int] = {}
    for col in cols:
        dtype = str(df[col].dtype)
        if "Int" in dtype or "Float" in dtype or "Decimal" in dtype:
            key = "numeric"
        elif "Date" in dtype or "Datetime" in dtype or "Time" in dtype:
            key = "date"
        elif "Boolean" in dtype:
            key = "boolean"
        else:
            key = "text"
        dtypes[key] = dtypes.get(key, 0) + 1

    return {
        "rows": df.height,
        "columns": len(cols),
        "column_names": cols,
        "type_counts": dtypes,
        "missing_ratio": float(df.null_count().sum_horizontal()[0]) / max(df.height * len(cols), 1),
        "preview": df.head(5).to_dicts(),
    }
