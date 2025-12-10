#!/bin/bash

PORT=8080

echo "🔍 Checking status of port $PORT..."

# Check if any process is listening on the port
PID=$(lsof -t -i:$PORT)

if [ -n "$PID" ]; then
  echo "⚠️  Port $PORT is occupied by PID $PID."
  echo "⚔️  Killing process $PID to free up the port..."
  kill -9 $PID
  
  # Double check
  sleep 1
  if [ -n "$(lsof -t -i:$PORT)" ]; then
    echo "❌ Failed to free port $PORT. Exiting."
    exit 1
  else
    echo "✅ Port $PORT is now free."
  fi
else
  echo "✅ Port $PORT is already free."
fi

echo "🚀 Starting Spring Boot Backend..."
cd backend
# Assumes you have mvnw wrapper, otherwise use 'mvn spring-boot:run'
if [ -f "./mvnw" ]; then
    ./mvnw spring-boot:run
else
    mvn spring-boot:run
fi
