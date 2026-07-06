.PHONY: dev proto agents dashboard

dev:
	docker compose up -d postgres
	sleep 3
	cd ledger-go && make migrate-up
	cd ledger-go && go run ./cmd/api

proto:
	# Generate Go stubs
	protoc --go_out=ledger-go/grpc/pb --go-grpc_out=ledger-go/grpc/pb \
	       --proto_path=proto proto/ledger.proto
	# Generate Python stubs
	cd agents && uv run python -m grpc_tools.protoc \
	       -I../proto \
	       --python_out=proto_generated \
	       --grpc_python_out=proto_generated \
	       ../proto/ledger.proto

agents:
	cd agents && uv run python main.py

dashboard:
	cd dashboard && npm run dev
