#!/bin/bash

GAME_ID=1
USER_ID=1
PREFIX=test
WAGERING_ID=0

curl -kX 'http://localhost:3000/aspect/api/game-init' \
-h 'Content-Type: application/json' \
-d '{
    "gameId": ${GAME_ID},
    "userId": ${USER_ID},
    "prefix": "${PREFIX}",
    "wageringBalanceId": ${WAGERING_ID}
}'
