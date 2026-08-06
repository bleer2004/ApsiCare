from pathlib import Path
import pandas as pd

BASE = Path(__file__).parent

xlsx = BASE / "casos_de_teste.xlsx"
csv = BASE / "casos_de_teste.csv"

df = pd.read_excel(xlsx)
df.to_csv(csv, index=False, encoding="utf-8-sig")

print("CSV criado!")