#!/bin/bash

# Variables
RESOURCE_GROUP="rg-realtimeDashboard"
LOCATION="francecentral"
DEPLOYMENT_NAME="apim-deployment-$(date +%Y%m%d%H%M%S)"
BICEP_FILE="apim.bicep"
PARAMETERS_FILE="apim.parameters.json"
OPENAPI_FILE="../openapi.yaml"
VALIDATE_SCRIPT="./validate-openapi.sh"
TEMP_DIR=$(mktemp -d)
OPENAPI_TEMP_FILE="${TEMP_DIR}/openapi_temp.yaml"
BYPASS_VALIDATION=${BYPASS_VALIDATION:-false}

# Function to clean up temporary files
cleanup() {
    echo "Cleaning up temporary files..."
    rm -rf "${TEMP_DIR}"
}

# Function to display usage
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --bypass-validation    Skip OpenAPI validation"
    echo "  --help                 Display this help message"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --bypass-validation)
            BYPASS_VALIDATION=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Set up trap to clean up on exit
trap cleanup EXIT

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in to Azure
if ! az account show &> /dev/null; then
    echo "You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Check if the OpenAPI file exists
if [ ! -f "$OPENAPI_FILE" ]; then
    echo "OpenAPI file not found at $OPENAPI_FILE"
    exit 1
fi

# Validate the OpenAPI specification
if [ -f "$VALIDATE_SCRIPT" ] && [ -x "$VALIDATE_SCRIPT" ]; then
    echo "Validating OpenAPI specification..."
    if [ "$BYPASS_VALIDATION" = "true" ]; then
        echo "Validation bypass enabled. Skipping validation."
        BYPASS_VALIDATION=true $VALIDATE_SCRIPT
    else
        $VALIDATE_SCRIPT
    fi
    
    if [ $? -ne 0 ]; then
        echo "OpenAPI validation failed. Please fix the errors and try again."
        echo "You can bypass validation with --bypass-validation if needed."
        exit 1
    fi
else
    echo "Validation script not found or not executable. Skipping validation."
fi

# Create resource group if it doesn't exist
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo "Creating resource group $RESOURCE_GROUP in $LOCATION..."
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
else
    echo "Resource group $RESOURCE_GROUP already exists."
fi

# Copy the OpenAPI file to the temporary location
echo "Preparing OpenAPI specification..."
cp "$OPENAPI_FILE" "$OPENAPI_TEMP_FILE"

# Deploy the Bicep template with the OpenAPI file directly
echo "Deploying API Management using Bicep template..."
echo "This may take several minutes. Please be patient..."

DEPLOYMENT_RESULT=$(az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --template-file "$BICEP_FILE" \
    --parameters "@$PARAMETERS_FILE" \
    --parameters apiSpecificationContent="@$OPENAPI_TEMP_FILE" \
    --output json)

DEPLOYMENT_STATUS=$?

# Check if deployment was successful
if [ $DEPLOYMENT_STATUS -ne 0 ]; then
    echo "Deployment failed. Please check the error messages above."
    exit 1
fi

# Get the deployment outputs
echo "Deployment completed successfully!"
echo "Getting deployment outputs..."

# Try to get outputs from deployment result
if command -v jq &> /dev/null; then
    # Extract APIM service name - this should always be available
    APIM_SERVICE_NAME=$(echo $DEPLOYMENT_RESULT | jq -r '.properties.outputs.apimServiceName.value // empty')
    
    # If we couldn't get the service name from outputs, try to get it from the parameters
    if [ -z "$APIM_SERVICE_NAME" ]; then
        echo "Warning: Could not get APIM service name from deployment outputs."
        # Try to extract from parameters or use a default
        APIM_SERVICE_NAME=$(jq -r '.parameters.apiManagementServiceName.value // empty' "$PARAMETERS_FILE")
        if [ -z "$APIM_SERVICE_NAME" ]; then
            APIM_SERVICE_NAME="apim-$(az group show --name $RESOURCE_GROUP --query id -o tsv | md5sum | cut -c1-8)"
            echo "Using generated APIM service name: $APIM_SERVICE_NAME"
        fi
    fi
    
    # Try to get API URL from outputs, or construct it
    API_URL=$(echo $DEPLOYMENT_RESULT | jq -r '.properties.outputs.apiUrl.value // empty')
    if [ -z "$API_URL" ]; then
        echo "Warning: Could not get API URL from deployment outputs. Constructing URL..."
        API_PATH=$(jq -r '.parameters.apiPath.value // "dashboard"' "$PARAMETERS_FILE")
        API_URL="https://${APIM_SERVICE_NAME}.azure-api.net/${API_PATH}"
    fi
    
    # Try to get WebSocket API URL from outputs, or construct it
    WS_URL=$(echo $DEPLOYMENT_RESULT | jq -r '.properties.outputs.wsApiUrl.value // empty')
    if [ -z "$WS_URL" ]; then
        echo "Warning: Could not get WebSocket URL from deployment outputs. Constructing URL..."
        API_PATH=$(jq -r '.parameters.apiPath.value // "dashboard"' "$PARAMETERS_FILE")
        WS_URL="wss://${APIM_SERVICE_NAME}.azure-api.net/${API_PATH}-ws"
    fi
    
    # Try to get portal URL from outputs, or construct it
    PORTAL_URL=$(echo $DEPLOYMENT_RESULT | jq -r '.properties.outputs.portalUrl.value // empty')
    if [ -z "$PORTAL_URL" ]; then
        echo "Warning: Could not get portal URL from deployment outputs. Constructing URL..."
        PORTAL_URL="https://${APIM_SERVICE_NAME}.developer.azure-api.net"
    fi
else
    echo "Warning: jq is not installed. Cannot parse deployment outputs."
    echo "Please install jq for better output handling."
    
    # Use az cli to get the APIM service name
    APIM_SERVICE_NAME=$(az apim list -g "$RESOURCE_GROUP" --query "[0].name" -o tsv)
    if [ -z "$APIM_SERVICE_NAME" ]; then
        echo "Could not determine APIM service name. Please check the Azure portal."
        exit 1
    fi
    
    # Construct URLs
    API_PATH=$(jq -r '.parameters.apiPath.value // "dashboard"' "$PARAMETERS_FILE" 2>/dev/null || echo "dashboard")
    API_URL="https://${APIM_SERVICE_NAME}.azure-api.net/${API_PATH}"
    PORTAL_URL="https://${APIM_SERVICE_NAME}.developer.azure-api.net"
    WS_URL="wss://${APIM_SERVICE_NAME}.azure-api.net/${API_PATH}-ws"
fi

echo "===== Deployment Summary ====="
echo "API Management service name: $APIM_SERVICE_NAME"
echo "API URL: $API_URL"
echo "WebSocket URL: $WS_URL"
echo "Developer portal URL: $PORTAL_URL"
echo "============================="

echo "You can now access your API at $API_URL"
echo "For WebSocket connections, use: $WS_URL"
echo "To manage your API, visit the Azure portal or the developer portal at $PORTAL_URL"
echo ""
echo "Note: It may take a few minutes for the API Management service to fully provision."
echo "If you cannot access the URLs immediately, please wait and try again later." 