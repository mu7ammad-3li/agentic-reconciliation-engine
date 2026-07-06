# 🏦 Agentic Reconciliation Engine

An enterprise-grade, multi-agent financial reconciliation platform. This system uses **CrewAI** agents to autonomously ingest, fuzzy-match, and reason about discrepancies between immutable ledger records and raw bank feeds.

It is backed by a high-performance **Go gRPC** core ledger and provides a pristine **Next.js** enterprise dashboard for human-in-the-loop review.

## 🌟 Architecture Overview

1. **The Core Ledger (Go)**
   The source of truth. Built with Go and gRPC, it ensures memory-safe, concurrent, and idempotent financial transactions. Uses **Protocol Buffers** for strict, typed contracts across languages.
2. **The AI Agents (Python / CrewAI)**
   A sequential crew of specialised agents powered by **Gemini 1.5 Pro**:
   * **Matching Agent:** Uses deterministic fuzzy-matching (RapidFuzz) to instantly and cheaply resolve 95% of standard transactions.
   * **Discrepancy Investigator:** An LLM agent that reasons about complex unmatched items (timing differences, FX rounding, fee mismatches) and outputs strictly structured JSON (via Pydantic).
   * **Alert Dispatcher:** Triggers immediate SMS (Twilio) and Email alerts for high-risk anomalies.
3. **The Dashboard (Next.js & TypeScript)**
   A crisp, high-contrast enterprise interface. Features a Real-time Overview, Discrepancy Queue, and Ledger Explorer. Enables Human-in-the-Loop (HITL) resolution for items where the AI's confidence score falls below regulatory thresholds.

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- `uv` (Fast Python package manager)
- Go 1.22+
- Node.js 20+

### Environment Setup
Copy the example environment files and fill in your API keys (Gemini/OpenAI, Twilio, SMTP).
```bash
cp .env.example .env
```

### Local Development

1. **Start the Database & Go gRPC Ledger**
   ```bash
   make dev
   ```
2. **Start the Next.js Dashboard**
   ```bash
   make dashboard
   ```
3. **Run the AI Agents**
   You can trigger the AI agents directly from the UI dashboard using the "Trigger AI Run" button, or manually via CLI:
   ```bash
   uv run python agents/main.py --account-id "uuid" --csv-path "test_bank_statement.csv" --period-start "2020-01-01" --period-end "2030-01-01"
   ```

## 🧠 Engineering Decisions
Every major technical decision—from why we chose `uv` over `pip`, to why we enforce a 1% floating-point fuzzy match tolerance before passing data to the LLM—is documented from first principles in the [engineering-decisions.md](engineering-decisions.md) journal.
