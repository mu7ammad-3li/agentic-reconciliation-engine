import os
import uuid
import psycopg
import json

DB_URL = os.getenv("DATABASE_URL", "postgres://ledger_user:ledger_password@localhost:5432/ledger")

def run_mock():
    print("🤖 Running mocked AI reconciliation cycle (no API key needed)...")
    
    conn = psycopg.connect(DB_URL)
    cur = conn.cursor()

    # Get our target account
    cur.execute("SELECT id FROM accounts WHERE owner_name = 'Corporate Operating Account' LIMIT 1")
    account_row = cur.fetchone()
    if not account_row:
        print("❌ No account found. Did you run seed_test_data.py?")
        return
    account_id = account_row[0]

    # Create a reconciliation run
    run_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO reconciliation_runs 
        (id, account_id, period_start, period_end, status, total_ledger_txns, total_bank_txns, 
         matched_count, partial_count, unmatched_count, completed_at)
        VALUES (%s, %s, NOW() - INTERVAL '30 days', NOW(), 'completed', 8, 9, 5, 2, 3, NOW())
    """, (run_id, account_id))

    # Fetch ledger transactions to attach our mock reasoning
    cur.execute("SELECT id, amount, created_at FROM transactions WHERE to_account_id = %s", (account_id,))
    txns = cur.fetchall()

    items = []
    
    # 1. Clean matches
    for i in range(5):
        if i < len(txns):
            t_id, t_amt, t_date = txns[i]
            items.append((
                run_id, t_id, f"INV-10{i} Payment", t_amt, t_date, f"INV-10{i} Payment",
                'matched', None, None, None, None
            ))

    # 2. Timing Difference (Partial)
    if len(txns) > 5:
        t_id, t_amt, t_date = txns[5]
        items.append((
            run_id, t_id, "Stripe Payout", t_amt, t_date, "Stripe Payout",
            'partial', 'timing_difference', 0.95, 'auto_match',
            "The amount matches exactly ($450.00), but the settlement date differs by 3 days. This is standard for Stripe payouts."
        ))

    # 3. FX Rounding/Fee (Partial)
    if len(txns) > 6:
        t_id, t_amt, t_date = txns[6]
        items.append((
            run_id, t_id, "Wire Transfer INTL", t_amt - 50, t_date, "Wire Transfer INTL",
            'partial', 'fee_mismatch', 0.88, 'flag_for_human',
            "Ledger expects $100.00, but bank cleared $99.50. This is likely an international wire fee, but since it falls outside the 0% fee policy, flagging for review."
        ))
        # Flag this one in transactions table too
        cur.execute("UPDATE transactions SET review_status = 'under_review' WHERE id = %s", (t_id,))

    # 4. Missing in Bank (Unmatched Ledger)
    if len(txns) > 7:
        t_id, t_amt, t_date = txns[7]
        items.append((
            run_id, t_id, None, None, None, None,
            'unmatched', 'timing_difference', 0.60, 'flag_for_human',
            "Pending cheque deposit of $150.00 exists in ledger but has not cleared the bank statement. Requires aging review."
        ))
        cur.execute("UPDATE transactions SET review_status = 'under_review' WHERE id = %s", (t_id,))

    # 5. Missing in Ledger (Unmatched Bank)
    items.append((
        run_id, None, "Monthly Account Maintenance Fee", -1500, t_date, "Monthly Account Maintenance Fee",
        'unmatched', 'missing_entry', 0.98, 'create_adjustment_entry',
        "Standard $15.00 bank maintenance fee. There is no corresponding ledger entry. Recommended action: create an automated adjustment."
    ))

    # Insert items
    cur.executemany("""
        INSERT INTO reconciliation_items 
        (run_id, ledger_transaction_id, bank_reference, bank_amount, bank_date, bank_description, 
         match_status, ai_cause, ai_confidence, ai_proposed_action, ai_reasoning)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, items)

    conn.commit()
    cur.close()
    conn.close()

    print(f"✅ Mock reconciliation run {run_id} completed!")
    print("👉 Check out your dashboard at http://localhost:3000")

if __name__ == "__main__":
    run_mock()
