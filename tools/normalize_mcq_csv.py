#!/usr/bin/env python3
"""Normalize Claude-generated MCQ CSV files for the MDCAT LMS pipeline.

Input CSV schema:
    question,option_a,option_b,option_c,option_d,correct_answer,explanation

Output CSV schema:
    question,option_a,option_b,option_c,option_d,correct_answer,explanation,needs_review

This utility preserves wrapped LaTeX, normalizes common chemistry/physics
notation, optionally injects DOCX diagram descriptions, and computes the same
review flag shape expected by the LMS backend review queue.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import mimetypes
import os
import re
import sys
import zipfile
from pathlib import Path
from urllib import error, request
import xml.etree.ElementTree as ET


CSV_HEADERS = [
    "question",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct_answer",
    "explanation",
    "needs_review",
]

MATH_REGEX = re.compile(r"(\$\$[\s\S]+?\$\$|\$[^$]+?\$)")
RAW_LATEX_REGEX = re.compile(r"\\rightarrow|\\rightleftharpoons|_\{|(?<!\\)\^\{")
INLINE_ARROW_REGEX = re.compile(r"(?<!\$)(<-->|<->|-->|->)")
CHEMICAL_EQUATION_HINT = re.compile(
    r"(\b[A-Z][a-z]?\d*|\+|->|-->|<->|<-->|=)"
)
SCIENTIFIC_CONTEXT_HINT = re.compile(
    r"[\d=+\-/%()]|cm|mm|kg|mol|volt|amp|joule|ohm|m/s|newton|pascal|kelvin|celsius",
    re.IGNORECASE,
)
GREEK_MAP = {
    "alpha": r"$\alpha$",
    "beta": r"$\beta$",
    "gamma": r"$\gamma$",
    "delta": r"$\Delta$",
    "lambda": r"$\lambda$",
    "omega": r"$\omega$",
    "mu": r"$\mu$",
    "theta": r"$\theta$",
    "sigma": r"$\sigma$",
    "pi": r"$\pi$",
}
FORMULA_REPLACEMENTS = [
    (re.compile(r"\bF=ma\b"), r"$F=ma$"),
    (re.compile(r"\bE=mc2\b"), r"$E=mc^2$"),
    (re.compile(r"\bv=u\+at\b"), r"$v=u+at$"),
    (re.compile(r"\bPV=nRT\b"), r"$PV=nRT$"),
]
UNIT_REPLACEMENTS = [
    (re.compile(r"\bm/s2\b"), r"$m/s^2$"),
    (re.compile(r"\bcm3\b"), r"$cm^3$"),
]


def split_math_segments(text: str) -> list[tuple[str, str]]:
    parts: list[tuple[str, str]] = []
    last = 0
    for match in MATH_REGEX.finditer(text):
        if match.start() > last:
            parts.append(("text", text[last:match.start()]))
        parts.append(("math", match.group(0)))
        last = match.end()
    if last < len(text):
        parts.append(("text", text[last:]))
    return parts


def scientific_context(segment: str, start: int, end: int) -> bool:
    left = segment[max(0, start - 18):start]
    right = segment[end:min(len(segment), end + 18)]
    return bool(SCIENTIFIC_CONTEXT_HINT.search(f"{left} {right}"))


def replace_chemical_formula(match: re.Match[str]) -> str:
    token = match.group(0)
    coefficient_match = re.match(r"^(\d+)(.*)$", token)
    coefficient = ""
    body = token
    if coefficient_match:
        coefficient = coefficient_match.group(1)
        body = coefficient_match.group(2)

    ion_match = re.match(r"^([A-Z][a-z]?)(\d*)([+-])$", body)
    if ion_match:
        element, subscript, charge_sign = ion_match.groups()
        charge = f"{subscript or '1'}{charge_sign}" if subscript else charge_sign
        return f"${coefficient}{element}^{{{charge}}}$"

    parts = re.findall(r"([A-Z][a-z]?)(\d*)", body)
    if not parts or "".join(element + digits for element, digits in parts) != body:
        return token

    latex = coefficient
    for element, digits in parts:
        if not digits:
            latex += element
        elif len(digits) == 1:
            latex += f"{element}_{digits}"
        else:
            latex += f"{element}_{{{digits}}}"
    return f"${latex}$"


def normalize_science_text(text: str) -> str:
    value = str(text or "").strip()
    if not value:
        return ""

    normalized_parts: list[str] = []
    for kind, segment in split_math_segments(value):
        if kind == "math":
            normalized_parts.append(segment)
            continue

        working = segment
        for pattern, replacement in FORMULA_REPLACEMENTS:
            working = pattern.sub(replacement, working)
        for pattern, replacement in UNIT_REPLACEMENTS:
            working = pattern.sub(replacement, working)

        def greek_replacer(match: re.Match[str]) -> str:
            word = match.group(0)
            replacement = GREEK_MAP[word.lower()]
            return replacement if scientific_context(working, match.start(), match.end()) else word

        for greek_word in GREEK_MAP:
            working = re.sub(
                rf"\b{greek_word}\b",
                greek_replacer,
                working,
                flags=re.IGNORECASE,
            )

        working = INLINE_ARROW_REGEX.sub(
            lambda m: r"$\rightleftharpoons$" if "<" in m.group(0) else r"$\rightarrow$",
            working,
        )

        working = re.sub(
            r"\b(?:\d+)?(?:[A-Z][a-z]?\d*){1,}\b(?:[+-])?",
            replace_chemical_formula,
            working,
        )

        stripped = working.strip()
        if stripped and "$" not in stripped and CHEMICAL_EQUATION_HINT.search(stripped):
            arrow_count = stripped.count(r"$\rightarrow$") + stripped.count(r"$\rightleftharpoons$")
            if "=" in stripped or arrow_count or "+" in stripped:
                normalized_inline = stripped.replace(r"$\rightarrow$", r"\rightarrow").replace(
                    r"$\rightleftharpoons$",
                    r"\rightleftharpoons",
                )
                working = f"${normalized_inline}$"

        normalized_parts.append(working)

    return "".join(normalized_parts).strip()


def has_raw_latex_outside_math(text: str) -> bool:
    stripped = MATH_REGEX.sub(" ", str(text or ""))
    return bool(RAW_LATEX_REGEX.search(stripped))


def extract_docx_images(docx_path: Path) -> list[tuple[str, str]]:
    namespaces = {
        "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
        "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
        "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    }
    images: list[tuple[str, str]] = []
    with zipfile.ZipFile(docx_path, "r") as archive:
        rels_root = ET.fromstring(archive.read("word/_rels/document.xml.rels"))
        relationships = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in rels_root
            if rel.attrib.get("Target", "").startswith("media/")
        }
        document_root = ET.fromstring(archive.read("word/document.xml"))
        for drawing in document_root.findall(".//wp:inline", namespaces):
            blip = drawing.find(".//a:blip", namespaces)
            if blip is None:
                continue
            rel_id = blip.attrib.get(
                "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
            )
            target = relationships.get(rel_id)
            if not target:
                continue
            media_type = mimetypes.guess_type(target)[0] or "image/png"
            image_bytes = archive.read(f"word/{target}")
            images.append((base64.b64encode(image_bytes).decode("utf-8"), media_type))
    return images


def describe_image_with_anthropic(image_b64: str, media_type: str) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return "[DIAGRAM: unavailable]"

    payload = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 120,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Describe this biology/physics/chemistry diagram in 1-2 sentences. "
                            "Focus only on scientific content. No preamble."
                        ),
                    },
                ],
            }
        ],
    }

    req = request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=60) as response:
            body = json.loads(response.read().decode("utf-8"))
            text = " ".join(
                item.get("text", "").strip()
                for item in body.get("content", [])
                if item.get("type") == "text"
            ).strip()
            return f"[DIAGRAM: {text or 'unavailable'}]"
    except (error.URLError, TimeoutError, json.JSONDecodeError):
        return "[DIAGRAM: unavailable]"


def load_rows(input_csv: Path) -> list[dict[str, str]]:
    with input_csv.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def flag_review(row: dict[str, str]) -> bool:
    question = row["question"].strip()
    options = [row["option_a"], row["option_b"], row["option_c"], row["option_d"]]
    explanation = row["explanation"].strip()
    answer = row["correct_answer"].strip().lower()

    if not question:
        return True
    if sum(1 for option in options if option.strip()) < 3:
        return True
    if answer not in {"a", "b", "c", "d"}:
        return True
    if not explanation:
        return True
    if "[DIAGRAM: unavailable]" in question:
        return True
    return any(
        has_raw_latex_outside_math(row.get(field, ""))
        for field in ("question", "option_a", "option_b", "option_c", "option_d", "explanation")
    )


def normalize_rows(rows: list[dict[str, str]], diagram_descriptions: list[str]) -> list[dict[str, str]]:
    normalized_rows: list[dict[str, str]] = []
    diagram_iter = iter(diagram_descriptions)

    for row in rows:
        normalized = {
            "question": normalize_science_text(row.get("question", "")),
            "option_a": normalize_science_text(row.get("option_a", "")),
            "option_b": normalize_science_text(row.get("option_b", "")),
            "option_c": normalize_science_text(row.get("option_c", "")),
            "option_d": normalize_science_text(row.get("option_d", "")),
            "correct_answer": str(row.get("correct_answer", "")).strip().lower()[:1],
            "explanation": normalize_science_text(row.get("explanation", "")),
        }

        if "[DIAGRAM]" in normalized["question"]:
            normalized["question"] = normalized["question"].replace(
                "[DIAGRAM]",
                next(diagram_iter, "[DIAGRAM: unavailable]"),
                1,
            )

        normalized["needs_review"] = "true" if flag_review(normalized) else "false"
        normalized_rows.append(normalized)

    return normalized_rows


def write_rows(rows: list[dict[str, str]], output_csv: Path) -> None:
    with output_csv.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_HEADERS)
        writer.writeheader()
        for row in rows:
            writer.writerow({header: row.get(header, "") for header in CSV_HEADERS})


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Normalize Claude-generated MCQ CSV files.")
    parser.add_argument("--input-csv", required=True, help="Source MCQ CSV path")
    parser.add_argument("--output-csv", required=True, help="Normalized output CSV path")
    parser.add_argument("--docx", help="Optional DOCX source used for diagram extraction")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_csv = Path(args.input_csv)
    output_csv = Path(args.output_csv)

    rows = load_rows(input_csv)
    diagram_descriptions: list[str] = []
    if args.docx:
        docx_path = Path(args.docx)
        if docx_path.exists() and docx_path.suffix.lower() == ".docx":
            for image_b64, media_type in extract_docx_images(docx_path):
                diagram_descriptions.append(describe_image_with_anthropic(image_b64, media_type))

    normalized_rows = normalize_rows(rows, diagram_descriptions)
    write_rows(normalized_rows, output_csv)
    print(f"Normalized {len(normalized_rows)} MCQs -> {output_csv}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
