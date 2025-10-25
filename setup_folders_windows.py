# setup_folders_windows.py
from pathlib import Path

# 원하는 루트 폴더 경로(필요하면 바꾸세요)
BASE_DIR = Path(r"C:\SpecCoding")

SUBDIRS = [
    "",  # 루트 자체
    "prompts",
    "specs",
    "openapi",
    "db",
    "migrations",
    "scripts",
    "src/routes",
    "src/payments/adapters",
    "src/infra/memory",
    "tests/payments/unit",
    "tests/payments/integration",
    ".github/workflows",
    "docs",
]

def main():
    created = []
    for sub in SUBDIRS:
        p = BASE_DIR / sub
        p.mkdir(parents=True, exist_ok=True)
        created.append(str(p))
    print("Created/verified directories:")
    print("\n".join(created))

if __name__ == "__main__":
    main()
