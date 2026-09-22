#!/usr/bin/env python3
"""Check that scraper-generated metadata matches the API repository data snapshot."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
from pathlib import Path


def fail(message: str) -> None:
    raise SystemExit(f"cross-repo contract failed: {message}")


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        fail(f"cannot read {path}: {error}")


def main() -> None:
    if len(sys.argv) != 3:
        fail("usage: check-source-contract.py <gzw-data-repo> <gzw-scraper-repo>")

    api_repo, scraper_repo = map(lambda value: Path(value).resolve(), sys.argv[1:])
    data_dir = api_repo / "data"
    metadata_path = data_dir / "_metadata.json"
    manifest_path = data_dir / "_manifest.json"
    generator_path = scraper_repo / "scripts" / "generate_metadata.py"
    if not data_dir.is_dir() or not generator_path.is_file():
        fail("expected API data directory and scraper metadata generator")

    metadata = load_json(metadata_path)
    manifest = load_json(manifest_path)
    spec = importlib.util.spec_from_file_location("gzw_scraper_metadata", generator_path)
    if spec is None or spec.loader is None:
        fail("could not load scraper metadata generator")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    generated = module.generate_metadata(
        data_dir,
        last_scraped_at=metadata.get("lastScrapedAt"),
        scraper_version=metadata.get("scraperVersion", module.SCRAPER_VERSION),
        parser_revision=metadata.get("parserRevision", module.PARSER_REVISION),
    )
    expected_datasets = {dataset["name"]: dataset for dataset in generated["datasets"]}
    actual_datasets = {dataset["name"]: dataset for dataset in metadata.get("datasets", [])}
    if generated.get("source") != metadata.get("source") or set(expected_datasets) != set(actual_datasets):
        fail("scraper output and API metadata disagree on source or dataset names")
    if generated.get("datasetCount") != metadata.get("datasetCount"):
        fail("scraper output and API metadata disagree on dataset count")
    for name, expected in expected_datasets.items():
        actual = actual_datasets[name]
        if expected.get("file") != actual.get("file") or expected.get("itemCount") != actual.get("itemCount"):
            fail(f"scraper output and API metadata disagree on dataset identity/count for {name}")
        expected_fields = expected.get("fields", {})
        actual_fields = actual.get("fields", {})
        if set(expected_fields) != set(actual_fields):
            fail(f"scraper output and API metadata disagree on fields for {name}")
        for field, expected_info in expected_fields.items():
            actual_info = actual_fields[field]
            for key in ("types", "optional", "nullable"):
                if expected_info.get(key) != actual_info.get(key):
                    fail(f"scraper/API metadata mismatch for {name}.{field}.{key}")

    datasets = manifest.get("datasets")
    if not isinstance(datasets, dict):
        fail("manifest datasets must be an object")
    names = {path.stem for path in data_dir.glob("*.json") if not path.name.startswith("_")}
    if names != set(datasets):
        fail("manifest dataset names differ from the published data files")
    for name, entry in datasets.items():
        path = data_dir / entry.get("file", "")
        if not path.is_file():
            fail(f"manifest file missing for {name}")
        content = path.read_bytes()
        if hashlib.sha256(content).hexdigest() != entry.get("sha256"):
            fail(f"manifest checksum mismatch for {name}")
        payload = json.loads(content)
        count = len(payload) if isinstance(payload, list) else 0
        if count != entry.get("records"):
            fail(f"manifest record count mismatch for {name}")

    validator = api_repo / "scripts" / "validate-data.js"
    result = subprocess.run(["node", str(validator)], cwd=api_repo, check=False)
    if result.returncode:
        fail("gzw-data data validator failed")

    print(json.dumps({"status": "ok", "datasets": len(names), "metadataSource": metadata.get("source"), "manifestVersion": manifest.get("manifestVersion")}, indent=2))


if __name__ == "__main__":
    main()
