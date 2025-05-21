#!/bin/bash

TOKEN="aspect-initial-token:3f7731a2ae152b2894476649ed14d6f51b3a2c15bb503e34d6560045a6855f97c2056558"
GAME_ID=789

curl -k "http://localhost:3000/aspect/wallet/balances?token=${TOKEN}&gameId=${GAME_ID}"