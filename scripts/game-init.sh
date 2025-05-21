#!/bin/bash

GAME_ID=789
USER_ID=565
PREFIX="Sushi..."
WAGERING_ID=0

curl -k -X POST 'http://localhost:3000/aspect/api/game-init' \
-H 'Content-Type: application/json' \
-d @- <<EOF
{
    "gameId": $GAME_ID,
    "userId": $USER_ID,
    "prefix": "$PREFIX",
    "wageringBalanceId": $WAGERING_ID
}
EOF