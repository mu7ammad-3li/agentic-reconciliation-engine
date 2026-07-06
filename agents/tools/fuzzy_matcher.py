import os
from datetime import datetime
from rapidfuzz import fuzz
from crewai.tools import BaseTool
from pydantic import BaseModel

AMOUNT_TOLERANCE = float(os.getenv("MATCH_AMOUNT_TOLERANCE_PCT", "0.01"))
DATE_TOLERANCE   = int(os.getenv("MATCH_DATE_TOLERANCE_DAYS", "2"))

class MatchInput(BaseModel):
    ledger_txns: list[dict]
    bank_txns: list[dict]

class FuzzyMatchTool(BaseTool):
    name: str = "fuzzy_match_transactions"
    description: str = (
        "Compare ledger transactions against bank transactions. "
        "Returns three lists: matched, partial (amount/date mismatch within tolerance), unmatched."
    )
    args_schema: type[BaseModel] = MatchInput

    def _run(self, ledger_txns: list[dict], bank_txns: list[dict]) -> dict:
        matched, partial, unmatched = [], [], []
        used_bank = set()

        for lt in ledger_txns:
            best_score, best_bank, best_category = 0, None, None
            l_amount = lt["amount"]
            l_date   = datetime.fromisoformat(lt["created_at"])

            for i, bt in enumerate(bank_txns):
                if i in used_bank:
                    continue

                b_amount = bt["amount_cents"]
                b_date   = datetime.fromisoformat(bt["date"])
                date_diff = abs((l_date - b_date).days)

                # Amount match within tolerance?
                amount_diff_pct = abs(l_amount - b_amount) / max(l_amount, 1)
                amount_ok = amount_diff_pct <= AMOUNT_TOLERANCE
                date_ok   = date_diff <= DATE_TOLERANCE

                # Memo similarity (0–100)
                memo_score = fuzz.token_set_ratio(
                    lt.get("status", ""), bt.get("description", "")
                )

                if amount_ok and date_ok:
                    score = 100 + memo_score  # perfect candidate
                    category = "matched"
                elif amount_ok or date_ok:
                    score = 50 + memo_score
                    category = "partial"
                else:
                    score = memo_score
                    category = "unmatched_candidate"

                if score > best_score:
                    best_score, best_bank, best_category = score, (i, bt), category

            if best_bank and best_category in ("matched", "partial"):
                used_bank.add(best_bank[0])
                entry = {"ledger": lt, "bank": best_bank[1], "score": best_score}
                (matched if best_category == "matched" else partial).append(entry)
            else:
                unmatched.append({"ledger": lt, "bank": None})

        # Bank txns with no ledger counterpart
        for i, bt in enumerate(bank_txns):
            if i not in used_bank:
                unmatched.append({"ledger": None, "bank": bt})

        return {"matched": matched, "partial": partial, "unmatched": unmatched}
