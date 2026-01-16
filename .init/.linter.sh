#!/bin/bash
cd /home/kavia/workspace/code-generation/color-match-puzzle-199784-199794/candy_crush_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

