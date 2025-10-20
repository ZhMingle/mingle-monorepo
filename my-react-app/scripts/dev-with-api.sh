#!/bin/bash
echo "Start dev with API (script moved to scripts/)."
vercel dev --listen 3000 > .dev-logs/vercel.log 2>&1 &
npm run dev
