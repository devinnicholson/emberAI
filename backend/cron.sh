#!/usr/bin/env sh
set -e
while true; do
  python /app/update_indices.py
  sleep 300
done
