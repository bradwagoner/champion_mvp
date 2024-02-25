export const environment = {
  environmentName: 'UNSET DEFAULT',
  buildDate: null,

  applicationTitle: '',

  cloudfrontDomain: 'https://fitnest.fitness',
  apiGatewayDomain: '', // see proxy.conf.json
  cognitoIdpUrl: 'https://idp.fitnest.fitness',
  cognitoClientId: '6cjhfq6v1ba8j30vsu7t2a00fh',
  cognitoUserPoolId: 'us-east-2_iaIgpJD0T',
  cognitoClientScopes: 'openid profile',
  cognitoCallbackUrl: 'https://fitnest.fitness',
  cognitoClientSecret: '',

  localJwtIdKey: 'champion-mvp-dev-jwt-id',
  localJwtAccessKey: 'champion-mvp-dev-jwt-access',
  localJwtRefreshKey: 'champion-mvp-dev-jwt-refresh',
};
