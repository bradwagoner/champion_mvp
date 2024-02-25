import * as cdk from 'aws-cdk-lib';
import {Fn} from 'aws-cdk-lib';
import {Construct} from "constructs";
import {
    AuthorizationType,
    AwsIntegration, CfnBasePathMapping,
    CognitoUserPoolsAuthorizer,
    Cors,
    EndpointType,
    IdentitySource,
    JsonSchemaType,
    MethodLoggingLevel,
    MethodOptions,
    Model,
    RestApi
} from "aws-cdk-lib/aws-apigateway";
import {UserPool} from "aws-cdk-lib/aws-cognito";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {IntegrationResponse} from "aws-cdk-lib/aws-apigateway/lib/integration";
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";
import {HostedZone} from "aws-cdk-lib/aws-route53";
import {DomainName} from "aws-cdk-lib/aws-apigatewayv2";
import {Route53} from "aws-sdk";
import {Distribution} from "aws-cdk-lib/aws-cloudfront";
import {RestApiOrigin} from "aws-cdk-lib/aws-cloudfront-origins";

interface ApiGatewayStackProps {
    resourcePrefix: string;
    domainName: string;
    certificateArn: string;
    hostedZoneId: string;
}

export class ApiGatewayStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
        super(scope, id);

        // cognitoUserPoolAuthorizer
        // Fn.importValue(props.resourcePrefix + '');

        // const regionalDomainName = Fn.importValue(props.resourcePrefix + 'DomainRegionalDomainName');
        // const regionalHostedZoneId = Fn.importValue(props.resourcePrefix + 'DomainRegionalHostedZoneId');

        // DomainName.fromDomainNameAttributes(this, props.resourcePrefix + 'DomainNameReference', {
        //     name: props.domainName,
        //     regionalDomainName: regionalDomainName,
        //     regionalHostedZoneId: 'us-east-1',
        // });

        // // distrobution
        // const distributionId = Fn.importValue(props.resourcePrefix + 'ContentCloudFrontDistributionId');
        // const distribution = Distribution.fromDistributionAttributes(this, 'DistributionFromAttributes', {
        //     domainName: props.domainName,
        //     distributionId: distributionId,
        //
        // });

        const userPoolId = Fn.importValue('UserPoolId');
        const userPoolArn = Fn.importValue('UserPoolArn');
        const userPool = UserPool.fromUserPoolId(this, props.resourcePrefix + 'UserPoolReferenceInApiGateway', userPoolId);

        const cognitoUserPoolAuthorizer = new CognitoUserPoolsAuthorizer(this, 'cognito-user-pool-authorizer', {
            cognitoUserPools: [userPool],
            identitySource: IdentitySource.header('authorization'),
            // resultsCacheTtl: Duration.seconds(0),
        });

        // const profileTableName = Fn.importValue(props.resourcePrefix + 'ProfileTableName');
        // const profileTableArn = Fn.importValue(props.resourcePrefix + 'ProfileTableArn');
        // const profileTableUserSubIndex = Fn.importValue(props.resourcePrefix + 'ProfileTableUserSubIndex');

        const assessmentsTableName = Fn.importValue('AssessmentsTableName');
        const assessmentsTableArn = Fn.importValue('AssessmentsTableArn');
        const assessmentsTableUserSubIndex = Fn.importValue('AssessmentsTableUserSubIndex');

        const questionnaireTableName = Fn.importValue('QuestionnaireTableName');
        const questionnaireTableArn = Fn.importValue('QuestionnaireTableArn');
        const questionnaireTableUserSubIndex = Fn.importValue('QuestionnaireTableUserSubIndex');

        // const zone = HostedZone.fromHostedZoneAttributes(this, props.resourcePrefix + 'HostedZoneReference', {
        //     hostedZoneId: props.hostedZoneId,
        //     zoneName: props.domainName,
        // });

        // const certificate = Certificate.fromCertificateArn(this, props.resourcePrefix + 'ApiCertificate', props.certificateArn);

        /*
        * API Gateway
        */

        // const domainName = DomainName.fromDomainNameAttributes(this, props.resourcePrefix + 'DomainNameReference', {
        //     name: props.domainName,
        //     regionalDomainName: props.domainName,
        //     regionalHostedZoneId: props.hostedZoneId
        // });
        //
        const api = new RestApi(this, `Fit-Nest Mvp Api`, {
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                statusCode: 200
            },
            restApiName: `Fit-Nest Mvp Data Service`,
            cloudWatchRole: true,
            endpointConfiguration: {
                types: [EndpointType.REGIONAL]
            },
            // domainName: {
            //     domainName: props.domainName,
            //     certificate: certificate,
            //     basePath: 'api',
            //     // endpointType: EndpointType.EDGE,
            // },
            deployOptions: {
                // stageName: '', // todo - environment build properties
                loggingLevel: MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                // accessLogDestination: new LogGroupLogDestination(fitNestLogGroup),
                // accessLogFormat: AccessLogFormat.jsonWithStandardFields({
                //   caller: false,
                //   httpMethod: true,
                //   ip: true,
                //   protocol: true,
                //   requestTime: true,
                //   resourcePath: true,
                //   responseLength: true,
                //   status: true,
                //   user: true,
                // }),
            },
        });

        new RestApiOrigin(api);

        new CfnBasePathMapping(this, props.resourcePrefix + 'ApiCfnBasePathMapping', {
            basePath: '',
            domainName: props.domainName,
            restApiId: api.restApiId,
            stage: api.deploymentStage.stageName,
        });

        // api.addDomainName(props.domainName + "DomainName", {
        //    domainName: props.domainName,
        //    certificate: certificate,
        // });

        // new ARecord(this, props.resourcePrefix + 'ApiARecord', {
        //    target: RecordTarget.fromAlias(new ApiGateway(api)),
        //    zone: zone,
        // });

        const apiGatewayRole = new Role(this, 'ApiGatewayRole', { // todo - rename this to something more appropriate. this is not where the mutate access is granted.
            assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
        });

        /**
         * The following Policy & Role grant the rest api access to specific actions
         */
        const fitNestCognitoIdpPolicy = new Policy(this, 'CognitoIdpPolicy', {
            statements: [
                new PolicyStatement({
                    actions: ['cognito-idp:AdminUpdateUserAttributes'],
                    effect: Effect.ALLOW,
                    resources: [
                        userPoolArn
                    ],
                }),
            ],
        });
        apiGatewayRole.attachInlinePolicy(fitNestCognitoIdpPolicy);

        const dynamoDbAccessToApiGatewayPolicy = new Policy(this, 'mutatePolicy', {
            statements: [
                new PolicyStatement({
                    actions: ['dynamodb:Query', 'dynamodb:PutItem', 'dynamodb:GetItem'],
                    effect: Effect.ALLOW,
                    resources: [
                        // profileTableArn,

                        assessmentsTableArn,
                        assessmentsTableArn + `/index/${assessmentsTableUserSubIndex}`,

                        questionnaireTableArn,
                        questionnaireTableArn + `/index/${questionnaireTableUserSubIndex}`,
                    ],
                }),
            ],
        });
        apiGatewayRole.attachInlinePolicy(dynamoDbAccessToApiGatewayPolicy);

        /*
        const someOtherRole = new Role(this, 'mutateRole', {
          assumedBy: new FederatedPrincipal(
            "cognito-identity.amazonaws.com",
            {
              StringEquals: {
                "cognito-identity.amazonaws.com:aud": fitNestUserPool.userPoolId, // https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_iam-condition-keys.html
              },
              "ForAnyValue:StringLike": {
                "cognito-identity.amazonaws.com:amr": "authenticated",
              },
            },
            "sts:AssumeRoleWithWebIdentity"
          ),
        })
        new CfnIdentityPoolRoleAttachment(this, 'CloudfrontMutateRoleAttachment', {
        identityPoolId: cloudFrontUserPool.ref,
        roles: {authenticated: someOtherRole.roleArn}
        });
        */

        /*
        const role = new Role(this, 'role', {
          assumedBy: new ServicePrincipal('')
        });
        fitNestUserPool.grant(role, 'cognito-idp:AdminCreateUser');
        */

        /*
         * CloudFront Distribution for the API
         */
        // This was working. I commented it out though because I'm pretty sure APIGateway has a cloudfront instance built in. I know it has the ttl setting I would want from CF sans the complexity.
        // so how do I make these available?

        // distribution.addBehavior('/api/*', new RestApiOrigin(api), {
        //     allowedMethods: AllowedMethods.ALLOW_ALL,
        //     viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        //     compress: false,
        //     // cachePolicy: CachePolicy.CACHING_DISABLED,
        //     // cachePolicy: CachePolicy.AMPLIFY,
        //     cachePolicy: new CachePolicy(this, 'API Gateway Cache Policy', {
        //         headerBehavior: CacheHeaderBehavior.allowList('Authorization', 'Origin', 'Referer'),
        //         queryStringBehavior: CacheQueryStringBehavior.none(), // todo - environment variables
        //         cookieBehavior: CacheCookieBehavior.none(), // todo - environment variables
        //         defaultTtl: Duration.minutes(0),
        //
        //         enableAcceptEncodingBrotli: false,
        //         enableAcceptEncodingGzip: false,
        //     }),
        //     originRequestPolicy: new OriginRequestPolicy(this, 'API Gateway Origin Policy', {
        //         headerBehavior: OriginRequestHeaderBehavior.none(), //allowList('Origin', 'Referer'),
        //         queryStringBehavior: OriginRequestQueryStringBehavior.all(),
        //         cookieBehavior: OriginRequestCookieBehavior.none(),
        //     }),
        // });
        //

        /**'
         * https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html
         */
        const errorResponses = [
            {
                selectionPattern: '400',
                statusCode: '400',

                // responseTemplates: {
                //   'application/json': `{
                //     "error": "400 - not found"
                //   }`,
                // },
            },
            {
                selectionPattern: '5\\d{2}',
                statusCode: '500',
                responseTemplates: {
                    'application/json': `{
            "error": "500 - something went wrong. $input.params(x)"
          }`,
                },
            }];

        const integrationResponseHeaders = [
            {
                statusCode: '200',
            },
            ...errorResponses
        ];


        const cognitoGetMethodOptions: MethodOptions = {
            authorizer: cognitoUserPoolAuthorizer,
            authorizationType: AuthorizationType.COGNITO,
            // authorizationScopes: ['openid', 'profile'], if enabled you must switch to access tokens
            methodResponses: [
                {
                    statusCode: '200', responseModels: {
                        'application/json': Model.EMPTY_MODEL,
                    },
                },
                {statusCode: '400'},
                {statusCode: '500'}
            ],
        };

        /**
         * Assessment Integration
         */
        const assessmentModel = new Model(this, 'AssessmentModel', {
            restApi: api,
            contentType: 'application/json',
            schema: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    joint: {type: JsonSchemaType.STRING},
                    motion: {type: JsonSchemaType.STRING},
                    rangeOfMotion: {type: JsonSchemaType.NUMBER},
                },
                required: ['joint', 'motion',]
            }
        });
        const validatedCognitoAssessmentMethodOptions: MethodOptions = {
            // authorizer: authorizer,
            authorizer: cognitoUserPoolAuthorizer,
            authorizationType: AuthorizationType.COGNITO,
            // authorizationScopes: ['openid', 'profile'], if enabled you must switch to access tokens
            methodResponses: [{statusCode: '200'}, {statusCode: '400'}, {statusCode: '500'}],
            requestModels: {
                'application/json': assessmentModel
            },
            requestValidatorOptions: {
                validateRequestBody: true,
                validateRequestParameters: true,
            },
        };
        const assessmentResponseBody: IntegrationResponse[] = [
            {
                statusCode: '200',
                responseTemplates: {
                    'application/json': `
            #set($inputRoot = $input.path('$'))
              [
                  #foreach($elem in $inputRoot.Items) {
                      "id": "$elem.id.S",
                      "joint": "$elem.joint.S",
                      "motion": "$elem.motion.S",
                      "rangeOfMotion": "$elem.range_of_motion.N",
                      "dateCreated": "$elem.date_created.N"
                  }#if($foreach.hasNext),#end
                  #end
              ]
          `
                }
            },
            ...errorResponses
        ];

        const getMyAssessmentsIntegration = new AwsIntegration({
            service: 'dynamodb',
            action: 'Query',
            options: {
                credentialsRole: apiGatewayRole,
                integrationResponses: assessmentResponseBody,
                requestTemplates: {
                    // passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
                    'application/json': `{
              "TableName": "${assessmentsTableName}",
              "IndexName": "${assessmentsTableUserSubIndex}",
              "KeyConditionExpression": "user_sub = :v1",
              "ExpressionAttributeValues": {
                  ":v1": {
                      "S": "$context.authorizer.claims.sub"
                  }
              }
          }`
                },
            },
        });
        const postAssessmentsIntegration = new AwsIntegration({
            service: 'dynamodb',
            action: 'PutItem',
            options: {
                // passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
                credentialsRole: apiGatewayRole,
                integrationResponses: integrationResponseHeaders,
                requestTemplates: {
                    'application/json': `{
              "Item": {
                "id": {
                  "S": "$context.authorizer.claims.sub|$input.path('$.joint')|$input.path('$.motion')|$input.path('$.rangeOfMotion')|$context.requestTimeEpoch"
                },
                "user_sub": {
                  "S": "$context.authorizer.claims.sub"
                },
                "joint": {
                  "S": "$input.path('$.joint')"
                },
                "motion": {
                  "S": "$input.path('$.motion')"
                },
                "range_of_motion": {
                  "N": "$input.path('$.rangeOfMotion')"
                },
                "date_created": {
                  "N": "$context.requestTimeEpoch"
                }
              },
              "TableName": "${assessmentsTableName}"
            }`,
                },
            },
        });


        /**
         * Questionnaire Integration
         */
        const questionnaireModel = new Model(this, 'QuestionnaireModel', {
            restApi: api,
            contentType: 'application/json',
            schema: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    joint: {type: JsonSchemaType.STRING},
                    assessmentIds: {type: JsonSchemaType.ARRAY},
                    experiencedPain: {type: JsonSchemaType.STRING}, // TODO - these would be cooler if they were booleans
                    experiencedWeakness: {type: JsonSchemaType.STRING},
                    avoidedOrUnable: {type: JsonSchemaType.STRING},
                    recentImprovement: {type: JsonSchemaType.STRING},
                    disruptsSleep: {type: JsonSchemaType.STRING},
                },
                required: ['joint', 'assessmentIds', 'experiencedPain', 'experiencedWeakness', 'avoidedOrUnable', 'recentImprovement', 'disruptsSleep',]
            }
        });
        const validatedCognitoQuestionnaireMethodOptions: MethodOptions = {
            // authorizer: authorizer,
            authorizer: cognitoUserPoolAuthorizer,
            authorizationType: AuthorizationType.COGNITO,
            // authorizationScopes: ['openid', 'profile'], if enabled you must switch to access tokens
            methodResponses: [{statusCode: '200'}, {statusCode: '400'}, {statusCode: '500'}],
            requestModels: {
                'application/json': questionnaireModel
            },
            requestValidatorOptions: {
                validateRequestBody: true,
                validateRequestParameters: true,
            },
        };
        const questionnaireResponseBody: IntegrationResponse[] = [
            {
                statusCode: '200',
                responseTemplates: {
                    'application/json': `
            #set($inputRoot = $input.path('$'))
              [
                  #foreach($elem in $inputRoot.Items) {
                      "id": "$elem.id.S",
                      "joint": "$elem.joint.S",
                      "assessmentIds": $elem.assessment_ids.SS,
                      "experiencedPain": "$elem.experienced_pain.BOOL",
                      "experiencedWeakness": "$elem.experienced_weakness.BOOL",
                      "avoidedOrUnable": "$elem.avoided_or_unable.BOOL",
                      "recentImprovement": "$elem.recent_improvement.BOOL",
                      "disruptsSleep": "$elem.disrupts_sleep.BOOL",
                      "dateCreated": "$elem.date_created.N"
                  }#if($foreach.hasNext),#end
                  #end
              ]
          `
                }
            },
            ...errorResponses
        ];
        const getMyQuestionnairesIntegration = new AwsIntegration({
            service: 'dynamodb',
            action: 'Query',
            options: {
                credentialsRole: apiGatewayRole,
                integrationResponses: questionnaireResponseBody,
                requestTemplates: {
                    // passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
                    'application/json': `{
              "TableName": "${questionnaireTableName}",
              "IndexName": "${questionnaireTableUserSubIndex}",
              "KeyConditionExpression": "user_sub = :v1",
              "ExpressionAttributeValues": {
                  ":v1": {
                      "S": "$context.authorizer.claims.sub"
                  }
              }
          }`
                },
            },
        });
        const postQuestionnaireIntegration = new AwsIntegration({
            service: 'dynamodb',
            action: 'PutItem',
            options: {
                // passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
                credentialsRole: apiGatewayRole,
                integrationResponses: integrationResponseHeaders,
                requestTemplates: {
                    'application/json': `{
              "Item": {
                "id": {
                  "S": "$context.extendedRequestId"
                },
                "user_sub": {
                  "S": "$context.authorizer.claims.sub"
                },
                "joint": {
                  "S": "$input.path('$.joint')"
                },
                "assessment_ids": {
                  "SS": $input.path('$.assessmentIds')
                },
                "experienced_pain": {
                  "BOOL": $input.path('$.experiencedPain')
                },
                "experienced_weakness": {
                  "BOOL": $input.path('$.experiencedWeakness')
                },
                "avoided_or_unable": {
                  "BOOL": $input.path('$.avoidedOrUnable')
                },
                "recent_improvement": {
                  "BOOL": $input.path('$.recentImprovement')
                },
                "disrupts_sleep": {
                  "BOOL": $input.path('$.disruptsSleep')
                },
                "date_created": {
                  "N": "$context.requestTimeEpoch"
                }
              },
              "TableName": "${questionnaireTableName}"
            }`,
                },
            },
        });


        // /**
        //  * Profile Integration
        //  */
        // const profileModel = new Model(this, 'ProfileModel', {
        //   restApi: api,
        //   contentType: 'application/json',
        //   schema: {
        //     type: JsonSchemaType.OBJECT,
        //     properties: {
        //       birthdate: {type: JsonSchemaType.STRING},
        //       address: {type: JsonSchemaType.STRING},
        //       givenName: {type: JsonSchemaType.STRING},
        //       familyName: {type: JsonSchemaType.STRING},
        //       gender: {type: JsonSchemaType.STRING},
        //     },
        //     required: ['birthdate', 'address','familyName', 'gender'], //  'givenName',
        //   }
        // })
        // const validatedCognitoProfileMethodOptions: MethodOptions = {
        //   authorizer: cognitoUserPoolAuthorizer,
        //   authorizationType: AuthorizationType.COGNITO,
        //   // authorizationScopes: ['openid', 'profile'], if enabled you must switch to access tokens
        //   methodResponses: [{statusCode: '200'}, {statusCode: '400'}, {statusCode: '500'}],
        //   requestModels: {
        //     'application/json': profileModel
        //   },
        //   requestValidatorOptions: {
        //     validateRequestBody: true,
        //     validateRequestParameters: true,
        //   },
        // };
        // const profileResponseBody: IntegrationResponse[] = [
        //   {
        //     statusCode: '200',
        //     responseTemplates: {
        //       'application/json': `
        //         #set($inputRoot = $input.path('$.Item'))
        //         {
        //               "address": "$inputRoot.address.S",
        //               "birthdate": "$inputRoot.birthdate.S",
        //               "givenName": "$inputRoot.given_name.S",
        //               "familyName": "$inputRoot.family_name.S",
        //               "gender": "$inputRoot.gender.S",
        //               "timestamp": "$inputRoot.timestamp.S"
        //         }
        //       `
        //     }
        //   },
        //   ...errorResponses
        // ];
        // const getMyProfileIntegration = new AwsIntegration({
        //   service: 'dynamodb',
        //   action: 'GetItem',
        //   options: {
        //     credentialsRole: dynamoDbAccessRoleForApiGateway,
        //     integrationResponses: profileResponseBody,
        //     // passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
        //     requestTemplates: {
        //       'application/json': `{
        //           "TableName": "${profileTable.tableName}",
        //           "Key": {
        //               "user_sub": {
        //                   "S": "$context.authorizer.claims.sub"
        //               }
        //           }
        //       }`
        //     },
        //   },
        // });
        // const updateMyProfileIntegration = new AwsIntegration({
        //   service: 'dynamodb',
        //   action: 'PutItem',
        //   options: {
        //     credentialsRole: dynamoDbAccessRoleForApiGateway,
        //     integrationResponses: integrationResponseHeaders,
        //     // passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
        //     requestTemplates: { // TODO <--- RIGHT HERE user_sub is mal-aligned with sub in the client
        //       'application/json': `{
        //           "Item": {
        //             "user_sub": {
        //               "S": "$context.authorizer.claims.sub"
        //             },
        //             "address": {
        //               "S": "$input.path('$.address')"
        //             },
        //             "birthdate": {
        //               "S": "$input.path('$.birthdate')"
        //             },
        //             "family_name": {
        //               "S": "$input.path('$.familyName')"
        //             },
        //             "given_name": {
        //               "S": "$input.path('$.givenName')"
        //             },
        //             "gender": {
        //               "S": "$input.path('$.gender')"
        //             },
        //             "timestamp": {
        //               "S": "$context.requestTimeEpoch"
        //             }
        //           },
        //           "TableName": "${profileTable.tableName}"
        //         }`,
        //     },
        //   },
        // });
        // const userProfileResource = apiGatewayResource.addResource('profile');
        // userProfileResource.addMethod('GET', getMyProfileIntegration, cognitoGetMethodOptions);
        // userProfileResource.addMethod('POST', updateMyProfileIntegration, validatedCognitoProfileMethodOptions);


        // /**
        //  * Cognito UpdateUserAttributes Integration
        //  */
        // const profileModel = new Model(this, 'ProfileModel', {
        //   restApi: api,
        //   contentType: 'application/json',
        //   schema: {
        //     type: JsonSchemaType.OBJECT,
        //     properties: {
        //       birthdate: {type: JsonSchemaType.STRING},
        //       address: {type: JsonSchemaType.STRING},
        //       givenName: {type: JsonSchemaType.STRING},
        //       familyName: {type: JsonSchemaType.STRING},
        //       gender: {type: JsonSchemaType.STRING},
        //       insurance: {type: JsonSchemaType.STRING}
        //     },
        //     required: ['birthdate', 'address', 'familyName', 'gender', "insurance"], //  'givenName',
        //   }
        // })
        // const validatedCognitoProfileMethodOptions: MethodOptions = {
        //   authorizer: cognitoUserPoolAuthorizer,
        //   authorizationType: AuthorizationType.COGNITO,
        //   // authorizationScopes: ['openid', 'profile'], if enabled you must switch to access tokens
        //   methodResponses: [{statusCode: '200'}, {statusCode: '400'}, {statusCode: '500'}],
        //   requestModels: {
        //     'application/json': profileModel
        //   },
        //   requestValidatorOptions: {
        //     validateRequestBody: true,
        //     validateRequestParameters: true,
        //   },
        // };
        //
        // const updateCognitoProfileLambda = new NodejsFunction(this, 'UpdateCognitoProfileLambda', {
        //   entry: 'cdk/lambdas/typescript/update-cognito-user-attributes/update-cognito-user-attributes.ts',
        //   environment: {
        //     cognitoUserPoolId: fitNestUserPool.userPoolId
        //   },
        // });
        // fitNestUserPool.grant(updateCognitoProfileLambda, 'cognito-idp:AdminUpdateUserAttributes');
        // const updateMyCognitoProfileIntegration = new LambdaIntegration(updateCognitoProfileLambda);

        /**
         * API Gateway mapping to AdminUpdateUserAttributes
         */
        const profileModel = new Model(this, 'ProfileModel', {
            restApi: api,
            contentType: 'application/json',
            schema: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    birthdate: {type: JsonSchemaType.STRING},
                    // address: {type: JsonSchemaType.STRING},
                    givenName: {type: JsonSchemaType.STRING},
                    familyName: {type: JsonSchemaType.STRING},
                    gender: {type: JsonSchemaType.STRING},
                    zipcode: {type: JsonSchemaType.STRING},
                    insurance: {type: JsonSchemaType.STRING}
                },
                required: ['birthdate', 'familyName', 'gender', 'zipcode', 'insurance'], //  'givenName', todo - reimplement
            }
        });
        const validatedCognitoProfileMethodOptions: MethodOptions = {
            authorizer: cognitoUserPoolAuthorizer,
            authorizationType: AuthorizationType.COGNITO,
            // authorizationScopes: ['openid', 'profile'], if enabled you must switch to access tokens
            methodResponses: [{statusCode: '200'}, {statusCode: '400'}, {statusCode: '500'}],
            requestModels: {
                'application/json': profileModel
            },
            requestValidatorOptions: {
                validateRequestBody: true,
                validateRequestParameters: true,
            },
        };
        const updateMyProfileIntegration = new AwsIntegration({
            service: 'cognito-idp',
            action: 'AdminUpdateUserAttributes',
            options: {
                credentialsRole: apiGatewayRole,
                integrationResponses: integrationResponseHeaders,
                // passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
                requestTemplates: { // TODO <--- RIGHT HERE user_sub is mal-aligned with sub in the client
                    'application/json': `{
             "UserAttributes": [
                {
                   "Name": "given_name",
                   "Value": "$input.path('$.givenName')"
                },
                {
                   "Name": "family_name",
                   "Value": "$input.path('$.familyName')"
                },
                {
                   "Name": "birthdate",
                   "Value": "$input.path('$.birthdate')"
                },
                {
                   "Name": "gender",
                   "Value": "$input.path('$.gender')"
                },
                {
                   "Name": "custom:zip_code",
                   "Value": "$input.path('$.zipcode')"
                },
                {
                   "Name": "custom:insurance",
                   "Value": "$input.path('$.insurance')"
                }
             ],
             "Username": "$context.authorizer.claims.sub",
             "UserPoolId": "${userPoolId}"
          }`,
                },
            },
        });


        /**
         * API Resource Definitions
         */
        const apiGatewayResource = api.root.addResource('api');

        const allAssessmentsResource = apiGatewayResource.addResource('assessments');
        allAssessmentsResource.addMethod('GET', getMyAssessmentsIntegration, cognitoGetMethodOptions);
        allAssessmentsResource.addMethod('POST', postAssessmentsIntegration, validatedCognitoAssessmentMethodOptions);

        const allQuestionnairesResource = apiGatewayResource.addResource('questionnaires');
        allQuestionnairesResource.addMethod('GET', getMyQuestionnairesIntegration, cognitoGetMethodOptions);
        allQuestionnairesResource.addMethod('POST', postQuestionnaireIntegration, validatedCognitoQuestionnaireMethodOptions);

        // const userAuthResource = apiGatewayResource.addResource('userAuth');
        // userAuthResource.addMethod('POST', updateMyCognitoProfileIntegration, validatedCognitoProfileMethodOptions);

        const userProfileResource = apiGatewayResource.addResource('profile');
        userProfileResource.addMethod('POST', updateMyProfileIntegration, validatedCognitoProfileMethodOptions);

        // const param = new StringParameter(this, 'api-gateway-address', {
        //   stringValue: api.url
        // });
    }
}