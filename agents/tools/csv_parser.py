import pandas as pd
from crewai.tools import BaseTool
from pydantic import BaseModel

class ParseCSVInput(BaseModel):
    file_path: str
    date_column: str = "Date"
    amount_column: str = "Amount"
    description_column: str = "Description"
    reference_column: str = "Reference"

class ParseBankCSVTool(BaseTool):
    name: str = "parse_bank_csv"
    description: str = (
        "Parse a bank statement CSV file. Returns a list of normalized transactions "
        "with date, amount_cents (integer), description, and reference fields."
    )
    args_schema: type[BaseModel] = ParseCSVInput

    def _run(self, file_path: str, date_column="Date", amount_column="Amount",
             description_column="Description", reference_column="Reference") -> list[dict]:
        df = pd.read_csv(file_path, parse_dates=[date_column])
        records = []
        for _, row in df.iterrows():
            # Convert decimal dollars to integer cents
            amount_cents = int(round(float(row[amount_column]) * 100))
            records.append({
                "date":         row[date_column].isoformat(),
                "amount_cents": abs(amount_cents),
                "direction":    "credit" if amount_cents > 0 else "debit",
                "description":  str(row.get(description_column, "")),
                "reference":    str(row.get(reference_column, "")),
            })
        return records
