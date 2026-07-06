import grpc
import os
from crewai.tools import BaseTool
from pydantic import BaseModel
from proto_generated import ledger_pb2, ledger_pb2_grpc

def _channel():
    addr = os.getenv("LEDGER_GRPC_ADDR", "localhost:50051")
    return grpc.insecure_channel(addr)

class GetTransactionsInput(BaseModel):
    account_id: str
    limit: int = 50
    offset: int = 0

class GetTransactionsTool(BaseTool):
    name: str = "get_ledger_transactions"
    description: str = (
        "Fetch transactions for an account from the ledger-go gRPC service. "
        "Returns a list of transaction dicts with id, amount (cents), status, created_at."
    )
    args_schema: type[BaseModel] = GetTransactionsInput

    def _run(self, account_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
        with _channel() as ch:
            stub = ledger_pb2_grpc.LedgerServiceStub(ch)
            resp = stub.GetTransactions(
                ledger_pb2.TransactionQuery(account_id=account_id, limit=limit, offset=offset)
            )
        return [
            {
                "id": t.id,
                "from_account_id": t.from_account_id,
                "to_account_id":   t.to_account_id,
                "amount":          t.amount,         # integer cents
                "status":          t.status,
                "review_status":   t.review_status,
                "created_at":      t.created_at.ToDatetime().isoformat(),
            }
            for t in resp.transactions
        ]

class FlagTransactionInput(BaseModel):
    transaction_id: str
    review_status: str   # under_review | resolved | auto_matched
    reason: str

class FlagTransactionTool(BaseTool):
    name: str = "flag_ledger_transaction"
    description: str = (
        "Flag a ledger transaction for human review or mark it auto-matched. "
        "Use review_status='under_review' for human escalation, 'auto_matched' when resolved by AI."
    )
    args_schema: type[BaseModel] = FlagTransactionInput

    def _run(self, transaction_id: str, review_status: str, reason: str) -> dict:
        with _channel() as ch:
            stub = ledger_pb2_grpc.LedgerServiceStub(ch)
            resp = stub.FlagTransaction(
                ledger_pb2.FlagRequest(
                    transaction_id=transaction_id,
                    review_status=review_status,
                    reason=reason,
                )
            )
        return {"success": resp.success, "transaction_id": resp.transaction_id}
