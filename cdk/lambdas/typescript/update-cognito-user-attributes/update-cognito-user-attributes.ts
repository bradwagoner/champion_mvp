import * as AWS from 'aws-sdk';
import {AWSError} from 'aws-sdk';
import {
  AdminUpdateUserAttributesRequest,
  AdminUpdateUserAttributesResponse
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {APIGatewayProxyCallbackV2, APIGatewayProxyEvent, Context} from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent, context: Context, callback: APIGatewayProxyCallbackV2): Promise<any> => {
  if (!event) {
    console.log('no event!');
    return {statusCode: 400, body: 'Invalid Request: missing request body'};
  }

  console.log('callback?', callback);
  console.log('context?', context);
  console.log('event?', event);

  const cognitoUserPoolId = process.env.cognitoUserPoolId;
  const userSub = event.requestContext?.authorizer?.claims?.sub;
  // const iss = event.requestContext?.authorizer?.claims?.iss; the cognito userpoolid is here but you have to parse it.

  // console.log('event!', JSON.stringify(event, null, 2));
  const body = event.body ? JSON.parse(event.body) : null;

  if (
    !cognitoUserPoolId ||
    !userSub ||
    // !body.givenName ||
    !body?.familyName ||
    !body?.gender ||
    !body?.birthdate ||
    !body?.address
  ) {
    console.log(`Couldn't find required attribute:`);
    return {
      statusCode: 400,
      body: `Invalid Request: missing request param: ${[
        cognitoUserPoolId ? cognitoUserPoolId : 'MISSING cognitoUserPooId',
        userSub ? userSub.slice(0, 10) : 'MISSING userSub',
        body?.givenName ? body.givenName : 'MISSING givenName',
        body?.familyName ? body.familyName : 'MISSING familyName',
        body?.gender ? body.gender : 'MISSING gender',
        body?.birthdate ? body.birthdate : 'MISSING birthdate',
        body?.address ? body.address : 'MISSING address',
      ].join(', ')}`
    };
  }

  let cognitoIdentityServiceProvider = null;
  try {
    cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
  } catch (errer) {
    console.log('Caught error instantiating cognitoIdServiceProvider:', errer);
    return {statusCode: 500, body: 'Caught error instantiating cognitoIdServiceProvider'};
  }

  const consoleRef = console;

  const cognitoCallback = function (err: AWSError, data: AdminUpdateUserAttributesResponse) {
    consoleRef.log('UpdateUserAttys err:', err);
    consoleRef.log('UpdateUserAttys data:', data);
    // console.log('UpdateUserAttys args:', arguments);
    if (err) {
      // console.log("Error calling updateUserAttributes:", err);
      return {statusCode: 500, body: 'Error from cognitIdServiceProvider'};
    } else {
      // console.log("Successfully updatedUserAttributes:", data);
      return {statusCode: 201, body: ''};
    }
  }

  const params: AdminUpdateUserAttributesRequest = {
    UserPoolId: cognitoUserPoolId,
    Username: userSub,
    UserAttributes: [
      {
        Name: 'given_name',
        Value: body.givenName
      },
      {
        Name: 'family_name',
        Value: body.familyName
      },
      {
        Name: 'gender',
        Value: body.gender
      },
      {
        Name: 'birthdate',
        Value: body.birthdate
      },
      {
        Name: 'address',
        Value: body.address
      },
    ],
  }

  let messages: string = '';

  try {
    console.log('calling updateUserAttributes!');
    let adminResponse = await cognitoIdentityServiceProvider.adminUpdateUserAttributes(params, cognitoCallback).promise();
    console.log('Success?', adminResponse);

    callback(null, {
      statusCode: 200,
      // body: JSON.stringify({}),
    });
  } catch(error) {
    console.log('error!', error);

    callback(error ? error?.toString() : 'Uncaught error.', {
      statusCode: 500,
      body: error ? error?.toString() : "Uncaught error."
    });
  }

  console.log('Messages:', messages);
  // console.log('Response:', adminResponse);
  console.log('finished calling updateUserAttributes....but... :/');
};
