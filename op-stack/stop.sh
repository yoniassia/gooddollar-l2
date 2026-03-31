#!/bin/bash
# Stop GoodDollar L2 devnet
cd "$(dirname "$0")"
echo "Stopping GoodDollar L2 devnet..."
docker compose down
echo "Devnet stopped."
