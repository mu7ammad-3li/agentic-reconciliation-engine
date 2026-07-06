from crewai import Agent
from tools.grpc_client import FlagTransactionTool

def build(llm) -> Agent:
    return Agent(
        role="Discrepancy Investigator",
        goal=(
            "For every unmatched or partially matched transaction, reason about the likely "
            "root cause and output a structured resolution with a confidence score."
        ),
        backstory=(
            "You are a senior financial auditor with deep knowledge of payment systems. "
            "You classify discrepancies by cause: timing_difference, duplicate, missing_entry, "
            "fx_rounding, or fee_mismatch. You always output structured JSON. "
            "When confidence is below 0.75 or the amount exceeds the threshold, "
            "you flag the transaction for human review using the flag_ledger_transaction tool."
        ),
        tools=[FlagTransactionTool()],
        llm=llm,
        verbose=True,
    )
