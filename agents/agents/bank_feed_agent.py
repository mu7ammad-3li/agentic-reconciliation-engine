from crewai import Agent
from tools.csv_parser import ParseBankCSVTool

def build(llm) -> Agent:
    return Agent(
        role="Bank Feed Analyst",
        goal="Parse the bank statement CSV and normalize it into structured transactions.",
        backstory=(
            "You are an expert at ingesting messy, real-world bank data in various formats. "
            "You normalize amounts to integer cents, standardize dates to ISO-8601, "
            "and flag any rows you cannot parse."
        ),
        tools=[ParseBankCSVTool()],
        llm=llm,
        verbose=True,
    )
