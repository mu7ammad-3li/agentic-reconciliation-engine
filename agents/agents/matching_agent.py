from crewai import Agent
from tools.fuzzy_matcher import FuzzyMatchTool

def build(llm) -> Agent:
    return Agent(
        role="Reconciliation Analyst",
        goal=(
            "Compare every ledger transaction against the bank statement. "
            "Classify each pair as matched, partial, or unmatched."
        ),
        backstory=(
            "You are a meticulous reconciliation analyst. You apply fuzzy-matching rules "
            "that account for settlement timing differences and minor amount discrepancies. "
            "You never mark a transaction as matched unless you are confident."
        ),
        tools=[FuzzyMatchTool()],
        llm=llm,
        verbose=True,
    )
