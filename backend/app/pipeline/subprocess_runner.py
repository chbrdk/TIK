from __future__ import annotations

import asyncio
import subprocess
from pathlib import Path

from .config import blaster_root, repo_root


async def run_node_script(
    script: str,
    args: list[str],
    *,
    cwd: Path | None = None,
    timeout: int = 600,
) -> subprocess.CompletedProcess[str]:
    root = cwd or repo_root()
    cmd = ["node", str(root / script), *args]
    return await asyncio.to_thread(
        subprocess.run,
        cmd,
        cwd=str(root),
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )


async def run_bash_script(
    script_rel: str,
    env: dict[str, str] | None = None,
    *,
    timeout: int = 300,
) -> subprocess.CompletedProcess[str]:
    root = repo_root()
    script = root / script_rel
    import os

    run_env = {**os.environ, **(env or {})}
    return await asyncio.to_thread(
        subprocess.run,
        ["bash", str(script)],
        cwd=str(root),
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
        env=run_env,
    )


def blaster_node(script_rel: str, args: list[str]) -> list[str]:
    """Command prefix for image-blaster scripts."""
    root = blaster_root()
    return ["node", str(root / script_rel), *args]


async def run_blaster_script(
    script_rel: str,
    args: list[str],
    *,
    timeout: int = 600,
) -> subprocess.CompletedProcess[str]:
    import os

    root = blaster_root()
    cmd = ["node", str(root / script_rel), *args]
    return await asyncio.to_thread(
        subprocess.run,
        cmd,
        cwd=str(root),
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
        env=os.environ.copy(),
    )
