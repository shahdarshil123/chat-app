#!/bin/sh
set -e

echo "Starting Ollama server..."
ollama serve &

echo "Waiting for Ollama..."
sleep 5

if [ "$OLLAMA_PULL_ON_START" = "true" ] && [ -n "$OLLAMA_MODELS" ]; then
  echo "Models to pull: $OLLAMA_MODELS"

  for model in $(echo "$OLLAMA_MODELS" | tr ',' ' '); do
    echo "Pulling model: $model"
    ollama pull "$model"

    echo "Warming up model: $model"
    ollama run "$model" "hello" >/dev/null 2>&1 || true
  done
fi

echo "Ollama startup complete."
wait

