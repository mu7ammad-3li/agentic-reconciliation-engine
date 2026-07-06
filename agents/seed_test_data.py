import os
import uuid
import random
from datetime import datetime, timedelta
import psycopg
import csv

DB_URL = os.getenv("DATABASE_URL", "postgres://ledger_user:ledger_password@localhost:5432/ledger")
CSV_PATH = "test_bank_statement.csv"

def generate_data():
    print("🌱 Starting test data generation...")
    
    # 1. Connect to DB
    try:
        conn = psycopg.connect(DB_URL)
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Failed to connect to DB: {e}. Is Postgres running?")
        return

    # 2. Create target account
    target_account_id = str(uuid.uuid4())
    customer_account_id = str(uuid.uuid4())
    
    cur.execute("""
        INSERT INTO accounts (id, owner_name, currency, created_at)
        VALUES (%s, 'Corporate Operating Account', 'USD', NOW()),
               (%s, 'External Customer', 'USD', NOW())
    """, (target_account_id, customer_account_id))
    
    print(f"✅ Created accounts. Target Account ID: {target_account_id}")

    ledger_txns = []
    bank_csv_rows = []
    
    base_date = datetime.utcnow() - timedelta(days=10)

    def add_pair(desc, ledger_amt, bank_amt, ledger_offset_days, bank_offset_days, kind="clean"):
        txn_id = str(uuid.uuid4())
        idemp_key = str(uuid.uuid4())
        
        l_date = base_date + timedelta(days=ledger_offset_days)
        b_date = base_date + timedelta(days=bank_offset_days)
        
        # Add to ledger (Only if not "missing_in_ledger")
        if kind != "missing_in_ledger":
            cur.execute("""
                INSERT INTO transactions 
                (id, idempotency_key, from_account_id, to_account_id, amount, status, created_at)
                VALUES (%s, %s, %s, %s, %s, 'completed', %s)
            """, (txn_id, idemp_key, customer_account_id, target_account_id, ledger_amt, l_date))
            
            # Insert double-entry ledger_entries
            cur.execute("""
                INSERT INTO ledger_entries (account_id, transaction_id, amount, direction, created_at)
                VALUES (%s, %s, %s, 'debit', %s),
                       (%s, %s, %s, 'credit', %s)
            """, (customer_account_id, txn_id, ledger_amt, l_date,
                  target_account_id, txn_id, ledger_amt, l_date))
        
        # Add to Bank CSV (Only if not "missing_in_bank")
        if kind != "missing_in_bank":
            # Bank amounts are in decimal dollars in the CSV
            bank_csv_rows.append({
                "Date": b_date.strftime("%Y-%m-%d"),
                "Amount": f"{(bank_amt / 100.0):.2f}",
                "Description": desc,
                "Reference": txn_id.split('-')[0] # partial ID as bank ref
            })

    # --- CLEAN TRANSACTIONS (Exact match) ---
    for i in range(5):
        amt = random.randint(1000, 50000) # $10.00 to $500.00
        add_pair(f"INV-{100+i} Payment", amt, amt, i, i, "clean")

    # --- FLAWED TRANSACTIONS (Partial Matches) ---
    # 1. Timing difference (ledger is today, bank clears 3 days later)
    add_pair("Stripe Payout", 45000, 45000, 1, 4, "flawed")
    
    # 2. Amount discrepancy (FX rounding or fee deduction) - Ledger says $100.00, Bank says $99.50
    add_pair("Wire Transfer INTL", 10000, 9950, 2, 2, "flawed")

    # --- DIRTY TRANSACTIONS (Unmatched) ---
    # 1. Missing in Bank (Ledger has it, bank statement doesn't)
    add_pair("Pending Cheque Deposit", 15000, 15000, 3, 0, "missing_in_bank")
    
    # 2. Missing in Ledger (Bank charged a fee, we didn't record it)
    add_pair("Monthly Account Maintenance Fee", 1500, -1500, 0, 5, "missing_in_ledger")
    
    # 3. Duplicate in Ledger (Accidentally recorded twice)
    duplicate_amt = 7500
    add_pair("Refund processing", duplicate_amt, duplicate_amt, 4, 4, "clean")
    # Add the duplicate to ledger only
    add_pair("Refund processing (DUPLICATE)", duplicate_amt, duplicate_amt, 4, 0, "missing_in_bank")

    # Commit DB
    conn.commit()
    cur.close()
    conn.close()
    
    # Write CSV
    with open(CSV_PATH, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["Date", "Amount", "Description", "Reference"])
        writer.writeheader()
        writer.writerows(bank_csv_rows)

    print(f"✅ Generated {len(bank_csv_rows)} rows in {CSV_PATH}")
    print("\n🚀 Done! To run the reconciliation, use:")
    print(f'uv run python main.py --account-id "{target_account_id}" --csv-path "{CSV_PATH}" --period-start "2020-01-01T00:00:00Z" --period-end "2030-01-01T00:00:00Z"')

if __name__ == "__main__":
    generate_data()
