@description('The name of the API Management service instance')
param apiManagementServiceName string = 'apim-${uniqueString(resourceGroup().id)}'

@description('The email address of the owner of the service')
@minLength(1)
param publisherEmail string

@description('The name of the owner of the service')
@minLength(1)
param publisherName string

@description('The pricing tier of this API Management service')
@allowed([
  'Developer'
  'Standard'
  'Premium'
  'BasicV2'
  'Consumption'
])
param sku string = 'BasicV2'

@description('The instance size of this API Management service.')
@allowed([
  1
  2
])
param skuCount int = 1

@description('Location for all resources.')
param location string = resourceGroup().location

@description('The name of the API to create.')
param apiName string = 'real-time-dashboard-api'

@description('The path for the API.')
param apiPath string = 'dashboard'

@description('The content of the OpenAPI specification.')
param apiSpecificationContent string

@description('The backend URL for the regular HTTP API.')
param httpBackendUrl string = 'https://localhost:5000'

@description('The backend URL for the WebSocket API.')
param wsBackendUrl string = 'wss://localhost:5001'

// Deploy the API Management service
resource apiManagementService 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: apiManagementServiceName
  location: location
  sku: {
    name: sku
    capacity: skuCount
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: publisherName
  }
}

// Create the API in API Management using the OpenAPI specification
resource api 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apiManagementService
  name: apiName
  properties: {
    format: 'openapi'
    value: apiSpecificationContent
    path: apiPath
    protocols: [
      'https'
    ]
    subscriptionRequired: false
    type: 'http'
    serviceUrl: httpBackendUrl
  }
}

// Create a WebSocket API for real-time communication
resource wsApi 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apiManagementService
  name: '${apiName}-ws'
  properties: {
    displayName: 'Real-time Dashboard WebSocket API'
    path: '${apiPath}-ws'
    protocols: [
      'wss'
    ]
    type: 'websocket'
    subscriptionRequired: false
    serviceUrl: wsBackendUrl
  }
}

// Create a product in API Management
resource product 'Microsoft.ApiManagement/service/products@2023-05-01-preview' = {
  parent: apiManagementService
  name: 'real-time-dashboard-product'
  properties: {
    displayName: 'Real-time Dashboard API'
    description: 'API for sending and receiving real-time updates to the dashboard'
    subscriptionRequired: true
    approvalRequired: false
    state: 'published'
  }
}

// Add the API to the product
resource productApi 'Microsoft.ApiManagement/service/products/apis@2023-05-01-preview' = {
  parent: product
  name: api.name
}

// Add the WebSocket API to the product
resource productWsApi 'Microsoft.ApiManagement/service/products/apis@2023-05-01-preview' = {
  parent: product
  name: wsApi.name
}

// Create a subscription for the product
resource subscription 'Microsoft.ApiManagement/service/subscriptions@2023-05-01-preview' = {
  parent: apiManagementService
  name: 'real-time-dashboard-subscription'
  properties: {
    scope: product.id
    displayName: 'Real-time Dashboard Subscription'
    state: 'active'
  }
}

// Create a policy for the API
resource apiPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: api
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
    <policies>
      <inbound>
        <base />
        <cors>
          <allowed-origins>
            <origin>*</origin>
          </allowed-origins>
          <allowed-methods>
            <method>GET</method>
            <method>POST</method>
            <method>OPTIONS</method>
          </allowed-methods>
          <allowed-headers>
            <header>Content-Type</header>
            <header>Authorization</header>
          </allowed-headers>
        </cors>
      </inbound>
      <backend>
        <base />
      </backend>
      <outbound>
        <base />
      </outbound>
      <on-error>
        <base />
      </on-error>
    </policies>
    '''
  }
}

// Outputs
output apimServiceName string = apiManagementService.name
output apiUrl string = 'https://${apiManagementService.properties.gatewayUrl}/${apiPath}'
output wsApiUrl string = 'wss://${apiManagementService.properties.gatewayUrl}/${apiPath}-ws'
output portalUrl string = 'https://${apiManagementServiceName}.developer.azure-api.net' 
