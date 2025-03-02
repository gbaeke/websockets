#!/bin/bash

# Set the server port (default to 5001 if not specified)
SERVER_PORT=${1:-5001}
SERVER_URL="http://localhost:${SERVER_PORT}"
FORMAT=${2:-yaml}

echo "Getting OpenAPI specification from ${SERVER_URL} in ${FORMAT} format"
echo "----------------------------"

if [ "$FORMAT" = "yaml" ]; then
  # Get YAML format (default)
  curl -s "${SERVER_URL}/openapi.yaml"
  echo -e "\n"
elif [ "$FORMAT" = "json" ]; then
  # Get JSON format
  curl -s "${SERVER_URL}/api-docs/swagger.json"
  echo -e "\n"
else
  echo "Invalid format. Use 'yaml' or 'json'."
  exit 1
fi

echo "----------------------------"
echo "To view the interactive documentation, visit: ${SERVER_URL}/api-docs"
echo "Usage: ./get-openapi.sh [port] [format]"
echo "  port: Server port (default: 5001)"
echo "  format: 'yaml' or 'json' (default: yaml)" 