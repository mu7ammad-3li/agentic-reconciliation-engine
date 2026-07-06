from crewai import Agent
from tools.grpc_client import GetTransactionsTool

def build(llm) -> Agent:
    return Agent(
        role="Ledger Data Specialist",
        goal="Retrieve all transactions for the reconciliation period from the ledger-go gRPC service.",
        backstory=(
            "You are a data access specialist with direct gRPC access to a production "
            "double-entry financial ledger. You retrieve transaction data accurately and "
            "pass it downstream without modification."
        ),
        tools=[GetTransactionsTool()],
        llm=llm,
        verbose=True,
    )
