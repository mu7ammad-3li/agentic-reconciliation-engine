import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "proto_generated"))

import argparse
from dotenv import load_dotenv
load_dotenv()

from crew import run

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run a reconciliation cycle")
    parser.add_argument("--account-id",    required=True)
    parser.add_argument("--csv-path",      required=True)
    parser.add_argument("--period-start",  required=True, help="ISO-8601 datetime")
    parser.add_argument("--period-end",    required=True, help="ISO-8601 datetime")
    args = parser.parse_args()

    result = run(
        account_id=args.account_id,
        csv_path=args.csv_path,
        period_start=args.period_start,
        period_end=args.period_end,
    )
    print(result)
