#!/bin/bash
cd /home/kavia/workspace/code-generation/music-streamer-platform-297904-297913/frontend_react_js
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

