from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8765
    data_dir: Path = Path("./data")
    max_upload_size_mb: int = 100
    llm_provider: str = "none"
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @property
    def runtime_dir(self) -> Path:
        return self.data_dir / "runtime"

    @property
    def samples_dir(self) -> Path:
        return self.data_dir / "samples"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


settings = Settings()
