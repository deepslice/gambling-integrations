#!/bin/bash

TOKEN=<token>
GAME_ID=<game-id>

curl -kX 'http://localhost:3000/api/v1/wallet/balances?token=${TOKEN}&gameId=${GAME_ID}'
