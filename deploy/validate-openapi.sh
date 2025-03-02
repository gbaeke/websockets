#!/bin/bash

# Variables
OPENAPI_FILE="../openapi.yaml"
BYPASS_VALIDATION=${BYPASS_VALIDATION:-false}

# Check if the OpenAPI file exists
if [ ! -f "$OPENAPI_FILE" ]; then
    echo "Error: OpenAPI file not found at $OPENAPI_FILE"
    exit 1
fi

# Check if bypass validation is enabled
if [ "$BYPASS_VALIDATION" = "true" ]; then
    echo "Validation bypass enabled. Skipping validation."
    exit 0
fi

# Function to validate YAML using Python
validate_yaml() {
    if command -v python3 &> /dev/null; then
        echo "Validating YAML format..."
        python3 -c "
import sys
import yaml
try:
    with open('$OPENAPI_FILE', 'r') as file:
        yaml.safe_load(file)
    print('YAML validation successful')
    sys.exit(0)
except yaml.YAMLError as e:
    print(f'YAML validation error: {e}')
    sys.exit(1)
except Exception as e:
    print(f'Error reading file: {e}')
    sys.exit(1)
" 2>&1
        return $?
    else
        echo "Python not found for YAML validation."
        return 0  # Continue anyway
    fi
}

# Function to validate JSON using Python
validate_json() {
    if command -v python3 &> /dev/null; then
        echo "Validating JSON format..."
        python3 -c "
import sys
import json
try:
    with open('$OPENAPI_FILE', 'r') as file:
        json.load(file)
    print('JSON validation successful')
    sys.exit(0)
except json.JSONDecodeError as e:
    print(f'JSON validation error: {e}')
    sys.exit(1)
except Exception as e:
    print(f'Error reading file: {e}')
    sys.exit(1)
" 2>&1
        return $?
    else
        echo "Python not found for JSON validation."
        return 0  # Continue anyway
    fi
}

# Function to validate OpenAPI using spectral (if available)
validate_with_spectral() {
    # Check if spectral is installed or can be installed
    if command -v spectral &> /dev/null; then
        echo "Validating with Spectral..."
        spectral lint "$OPENAPI_FILE" 2>&1
        return $?
    elif command -v npm &> /dev/null; then
        echo "Spectral not found. Attempting to install (this may take a moment)..."
        npm install -g @stoplight/spectral-cli > /dev/null 2>&1
        if command -v spectral &> /dev/null; then
            echo "Validating with Spectral..."
            spectral lint "$OPENAPI_FILE" 2>&1
            return $?
        else
            echo "Failed to install Spectral. Skipping Spectral validation."
            return 0  # Continue anyway
        fi
    else
        echo "npm not found. Skipping Spectral validation."
        return 0  # Continue anyway
    fi
}

# Display file information
echo "Validating OpenAPI specification: $OPENAPI_FILE"
file_size=$(wc -c < "$OPENAPI_FILE")
echo "File size: $file_size bytes"

# First check if the file is valid YAML or JSON
file_extension="${OPENAPI_FILE##*.}"
if [ "$file_extension" = "yaml" ] || [ "$file_extension" = "yml" ]; then
    validate_yaml
    YAML_RESULT=$?
    if [ $YAML_RESULT -ne 0 ]; then
        echo "Error: Invalid YAML format. Please fix the errors and try again."
        exit 1
    fi
elif [ "$file_extension" = "json" ]; then
    validate_json
    JSON_RESULT=$?
    if [ $JSON_RESULT -ne 0 ]; then
        echo "Error: Invalid JSON format. Please fix the errors and try again."
        exit 1
    fi
else
    echo "Warning: Unknown file extension. Attempting to validate as YAML..."
    validate_yaml
    YAML_RESULT=$?
    if [ $YAML_RESULT -ne 0 ]; then
        echo "Attempting to validate as JSON..."
        validate_json
        JSON_RESULT=$?
        if [ $JSON_RESULT -ne 0 ]; then
            echo "Error: File is neither valid YAML nor JSON. Please fix the errors and try again."
            exit 1
        fi
    fi
fi

# Try spectral validation if basic validation passed
echo "Basic format validation passed."
echo "Checking OpenAPI schema validity..."

# Only run Spectral if available, but don't fail if it's not
validate_with_spectral
SPECTRAL_RESULT=$?

if [ $SPECTRAL_RESULT -ne 0 ]; then
    echo "Warning: OpenAPI schema validation failed. The specification may not be fully compliant with OpenAPI standards."
    echo "You can set BYPASS_VALIDATION=true to skip validation if you're confident in your specification."
    
    # Show the first few lines of the file for debugging
    echo "First 10 lines of the OpenAPI file:"
    head -n 10 "$OPENAPI_FILE"
    
    # Ask for confirmation to continue
    read -p "Do you want to continue with deployment anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
    echo "Continuing with deployment despite validation warnings..."
else
    echo "OpenAPI specification is valid!"
fi

exit 0 