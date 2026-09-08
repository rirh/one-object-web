"""Keep handwritten source and tests within the 500-line project limit."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
violations = []
for folder in (root / "src", root / "tests"):
    for path in sorted(folder.rglob("*")):
        if path.is_file() and path.suffix in {".ts", ".tsx", ".css", ".rs"}:
            lines = len(path.read_text().splitlines())
            if lines > 500:
                violations.append(f"{path.relative_to(root)}: {lines} lines (limit 500)")
if violations:
    print("\n".join(violations))
    sys.exit(1)
print("Source size check passed (500-line limit).")
