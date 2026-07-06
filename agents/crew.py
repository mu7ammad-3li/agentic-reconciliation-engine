import os
from crewai import Crew, Task, Process

from agents.ledger_agent      import build as build_ledger
from agents.bank_feed_agent   import build as build_bank_feed
from agents.matching_agent    import build as build_matching
from agents.discrepancy_agent import build as build_discrepancy
from agents.alert_agent       import build as build_alert

# ─── LLM ─────────────────────────────────────────────────────────
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.1,  # low temp for deterministic financial reasoning
    )
except ImportError:
    # fallback if testing
    llm = None

# ─── Agents ──────────────────────────────────────────────────────
ledger_agent      = build_ledger(llm)
bank_feed_agent   = build_bank_feed(llm)
matching_agent    = build_matching(llm)
discrepancy_agent = build_discrepancy(llm)
alert_agent       = build_alert(llm)

# ─── Tasks ───────────────────────────────────────────────────────
def build_tasks(account_id: str, csv_path: str, period_start: str, period_end: str):
    fetch_ledger = Task(
        description=f"Fetch all transactions for account {account_id} from {period_start} to {period_end} using the get_ledger_transactions tool.",
        expected_output="A JSON list of transaction dicts with id, amount, status, created_at.",
        agent=ledger_agent,
    )

    parse_bank = Task(
        description=f"Parse the bank statement at {csv_path} using the parse_bank_csv tool.",
        expected_output="A JSON list of normalized bank transaction dicts with date, amount_cents, direction, description, reference.",
        agent=bank_feed_agent,
    )

    match_txns = Task(
        description=(
            "Using the ledger transactions and bank transactions from previous tasks, "
            "run fuzzy_match_transactions to classify all pairs. "
            "Return three lists: matched, partial, unmatched."
        ),
        expected_output="A JSON object with 'matched', 'partial', and 'unmatched' lists.",
        agent=matching_agent,
        context=[fetch_ledger, parse_bank],
    )

    investigate = Task(
        description=(
            "For every item in the 'partial' and 'unmatched' lists from the matching task: "
            "1. Reason about the root cause. "
            "2. Output structured JSON: {cause, confidence, proposed_action, reasoning} "
            "   where cause ∈ [timing_difference, duplicate, missing_entry, fx_rounding, fee_mismatch, unknown] "
            "   and proposed_action ∈ [auto_match, create_adjustment_entry, flag_for_human]. "
            "3. If proposed_action='flag_for_human' OR confidence < 0.75, "
            "   call flag_ledger_transaction with review_status='under_review'."
        ),
        expected_output="A JSON list of discrepancy resolution objects, one per unmatched/partial item.",
        agent=discrepancy_agent,
        context=[match_txns],
    )

    send_alerts = Task(
        description=(
            "Review the discrepancy resolutions. "
            "Send an SMS alert for every item flagged for human review. "
            "Then send a daily summary email with a detailed breakdown of total matched, partial, unmatched, and flagged counts."
        ),
        expected_output="Confirmation that alerts and emails were sent successfully.",
        agent=alert_agent,
        context=[investigate],
    )

    return [fetch_ledger, parse_bank, match_txns, investigate, send_alerts]


def run(account_id: str, csv_path: str, period_start: str, period_end: str) -> dict:
    tasks = build_tasks(account_id, csv_path, period_start, period_end)
    crew = Crew(
        agents=[ledger_agent, bank_feed_agent, matching_agent, discrepancy_agent, alert_agent],
        tasks=tasks,
        process=Process.sequential,
        verbose=True,
    )
    return crew.kickoff()
