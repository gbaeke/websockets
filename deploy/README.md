# Azure API Management Deployment

This directory contains files for deploying Azure API Management and importing the OpenAPI specification for the Real-time Dashboard API.

## Files

- `apim.bicep`: Bicep template for deploying Azure API Management
- `apim.parameters.json`: Parameters file for the Bicep template
- `deploy-apim.sh`: Deployment script for deploying the Bicep template
- `validate-openapi.sh`: Script to validate the OpenAPI specification

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Azure subscription
- Bash shell (or Windows Subsystem for Linux)
- For validation: Node.js (optional) or Python 3 (optional)
- `jq` command-line tool (recommended for parsing deployment outputs)

## How It Works

The deployment process:
1. Validates the OpenAPI specification using Spectral or basic YAML validation
2. Creates a temporary copy of the OpenAPI file in a secure temporary directory
3. Passes the file directly to the Azure CLI deployment command
4. Deploys the Bicep template with the OpenAPI content
5. Retrieves deployment outputs or constructs fallback values if outputs are unavailable
6. Cleans up temporary files automatically

This approach allows you to deploy the API Management service with the OpenAPI specification without needing to host the specification file externally or deal with escaping issues.

## Deployment Steps

1. **Update the parameters file**

   Edit the `apim.parameters.json` file to update the following parameters:
   
   - `publisherEmail`: Email address of the API Management service owner
   - `publisherName`: Name of the API Management service owner
   
   The OpenAPI content will be automatically read from the local file.

2. **Run the deployment script**

   ```bash
   ./deploy-apim.sh
   ```

   This script will:
   - Check if Azure CLI is installed
   - Check if you're logged in to Azure
   - Verify that the OpenAPI file exists
   - Validate the OpenAPI specification (if validation script is available)
   - Create a resource group if it doesn't exist
   - Create a temporary copy of the OpenAPI file
   - Deploy the Bicep template with the OpenAPI content
   - Retrieve deployment outputs or construct fallback values
   - Clean up temporary files
   - Display the deployment outputs

## Validation

The validation script (`validate-openapi.sh`) provides two methods of validation:

1. **Spectral Validation**: Uses Stoplight Spectral to perform comprehensive OpenAPI validation
2. **Basic YAML Validation**: Falls back to basic YAML syntax validation using Python if Spectral is not available

The validation is designed to be quiet and only show relevant errors.

## Customizing the Deployment

You can customize the deployment by modifying the following files:

- `apim.bicep`: Modify the Bicep template to add or change resources
- `apim.parameters.json`: Update parameter values
- `deploy-apim.sh`: Update variables like resource group name, location, or the path to the OpenAPI file

## Accessing the API

After deployment, you can access the API at the URL provided in the deployment outputs. The API will be available at:

```
https://{apim-service-name}.azure-api.net/dashboard
```

The developer portal will be available at:

```
https://{apim-service-name}.developer.azure-api.net
```

Note that it may take a few minutes for the API Management service to fully provision. If you cannot access the URLs immediately after deployment, please wait and try again later.

## Troubleshooting

If you encounter issues during deployment, check the following:

1. Make sure you're logged in to Azure CLI with `az login`
2. Verify that you have sufficient permissions in the Azure subscription
3. Check that the OpenAPI file exists at the specified path
4. Ensure your OpenAPI specification is valid and follows the OpenAPI 3.0 standard (not 3.1)
5. Review the deployment logs for any errors
6. Check if `jq` is installed (recommended for parsing deployment outputs)

### Common Issues

1. **Deployment Output Evaluation Failed**
   
   If you see an error like "DeploymentOutputEvaluationFailed", this usually means that one of the outputs couldn't be evaluated. The script has been updated to handle this gracefully by constructing fallback values for the outputs.

2. **Portal URL Not Available**
   
   The developer portal URL might not be immediately available after deployment. The script now constructs this URL based on the service name instead of relying on the deployment output.

3. **API Management Service Not Fully Provisioned**
   
   API Management services can take several minutes to fully provision. If you can't access the API or developer portal immediately after deployment, wait a few minutes and try again.

4. **OpenAPI Validation Errors**
   
   If the validation script reports errors in your OpenAPI specification, fix them before attempting deployment. Azure API Management requires a valid OpenAPI 3.0 specification. 