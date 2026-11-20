#!/usr/bin/env python3
"""Checks that every local href/src used by HTML files exists on disk.

Usage:  py tools/check_links.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {"node_modules", ".git", "clients"}
ATTR_RE = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.I)
EXTERNAL_RE = re.compile(r"^(https?:|mailto:|tel:|data:|javascript:|//)", re.I)


def html_files():
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if name.endswith(".html"):
                yield os.path.join(base, name)


def main():
    checked = 0
    missing = []
    files = list(html_files())

    for path in files:
        with open(path, encoding="utf-8") as handle:
            html = handle.read()
        for ref in ATTR_RE.findall(html):
            ref = ref.strip()
            if not ref or ref.startswith("#") or ref.startswith("/"):
                continue
            if EXTERNAL_RE.match(ref):
                continue
            if "${" in ref or "{{" in ref:
                # Template literal filled in by page JavaScript at runtime.
                continue
            clean = ref.split("?")[0].split("#")[0]
            if not clean:
                continue
            checked += 1
            target = os.path.normpath(os.path.join(os.path.dirname(path), clean))
            if not os.path.exists(target):
                missing.append(f"{os.path.relpath(path, ROOT)} -> {ref}")

    print(f"Checked {checked} local references across {len(files)} HTML files.")
    if missing:
        print(f"\nMissing {len(missing)} reference(s):")
        for item in missing:
            print(f"  {item}")
        return 1
    print("All local references resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
