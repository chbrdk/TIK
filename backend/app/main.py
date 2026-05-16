from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.persona_reality.router import router as persona_reality_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Persona Reality API",
        version="1.0.0",
        description="Composes scene_config.json for the Persona Reality VR experience.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", include_in_schema=False)
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(persona_reality_router)
    return app


app = create_app()
