import * as cdk from 'aws-cdk-lib';
import {Duration, RemovalPolicy, SecretValue} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AttributeType, Billing, BillingMode, ProjectionType, Table, TableV2} from "aws-cdk-lib/aws-dynamodb";
import {
    AuthorizationType,
    AwsIntegration,
    CognitoUserPoolsAuthorizer,
    Cors,
    IdentitySource,
    JsonSchemaType,
    MethodLoggingLevel,
    MethodOptions,
    Model,
    RestApi
} from "aws-cdk-lib/aws-apigateway";
import {Effect, ManagedPolicy, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {
    AccountRecovery,
    ClientAttributes,
    Mfa,
    OAuthScope,
    StringAttribute,
    UserPool,
    UserPoolClientIdentityProvider,
    UserPoolEmail,
    VerificationEmailStyle
} from "aws-cdk-lib/aws-cognito";
import {Bucket, BucketAccessControl, ObjectOwnership} from "aws-cdk-lib/aws-s3";
import {
    AllowedMethods,
    CacheCookieBehavior,
    CacheHeaderBehavior,
    CachePolicy,
    CacheQueryStringBehavior,
    Distribution,
    OriginAccessIdentity,
    OriginRequestCookieBehavior,
    OriginRequestHeaderBehavior,
    OriginRequestPolicy,
    OriginRequestQueryStringBehavior,
    ViewerProtocolPolicy
} from "aws-cdk-lib/aws-cloudfront";
import {RestApiOrigin, S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {BucketDeployment, CacheControl, Source} from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";
import {IntegrationResponse} from "aws-cdk-lib/aws-apigateway/lib/integration";
import {
    CodeBuildAction,
    CodeDeployServerDeployAction,
    GitHubSourceAction,
    GitHubTrigger, S3DeployAction
} from "aws-cdk-lib/aws-codepipeline-actions";
import {Artifact, Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {BuildSpec, Project} from "aws-cdk-lib/aws-codebuild";
import {CodeBuildProject} from "aws-cdk-lib/aws-events-targets";

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        /*
         * CloudWatch
         */
        let fitNestLogGroup: LogGroup = new LogGroup(this, 'Fit Nest Log Group', {
            retention: RetentionDays.ONE_MONTH
        });

        /*
         * S3 / CloudFront
         */
        const content = new Bucket(this, 'fit-nest-content', {
            accessControl: BucketAccessControl.PRIVATE,
        });

        /*
        const pipelineRepo: IRepository;
        const pipeline = new CodePipeline(this, 'Pipeline', {
          // pipelineName: 'fit-nest-mvp-pipeline',
          synth: new ShellStep('Synth', {
            input: CodePipelineSource.codeCommit(pipelineRepo, '', {

            }),
            commands: ['npm ci', 'npm run build', 'npx cdk synth']
          })
        });
        */

        const angularSourceDir = '../../dist/champion-mvp-dev/browser';
        new BucketDeployment(this, 'fit-nest-deployment', {
            destinationBucket: content,
            cacheControl: [CacheControl.noCache()], // todo - address caching in general. api gateway / method level cache invalidation
            sources: [Source.asset(path.resolve(__dirname, angularSourceDir))]
        });

        const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
        content.grantRead(originAccessIdentity);

        const pipeline = new Pipeline(this, 'Dev Pipeline');

        const gitHubStage = pipeline.addStage({
            stageName: 'Deploy',
        });
        const buildStage = pipeline.addStage({
            stageName: 'FitNest-Built',
            placement: {
                justAfter: gitHubStage
            }
        });

        const mainMergedOutput = new Artifact();
        const action = new GitHubSourceAction({
            actionName: 'GitHub_Main_Merge',
            owner: 'bradwagoner',
            repo: 'https://github.com/bradwagoner/champion_mvp.git',
            oauthToken: SecretValue.secretsManager('fitnest-codedeploy-github-token'),
            output: mainMergedOutput,
            branch: 'main',
        });

        gitHubStage.addAction(action);


        const codeBuildRole = new Role(this, 'CodeBuildRole', {
            assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('CloudFrontFullAccess')
            ]
        });

        const project = new Project(this, 'FitNestProject', {
            role: codeBuildRole,
            buildSpec: BuildSpec.fromAsset(path.resolve(__dirname, angularSourceDir))
        });

        const buildAction = new CodeBuildAction({
            actionName: 'CodeBuild',
            input: mainMergedOutput,
            project: project,
        });

        buildStage.addAction(buildAction);

        /*
        let cloudFrontLoggingLambda: EdgeFunction = new EdgeFunction(this, 'CloudFront Logging Lamdba', {
          runtime: Runtime.NODEJS_LATEST,
          handler: 'cloudFrontLoggingLambda.handler',
          code: Code.fromAsset('cdk/lambdas/typescript/log-cloudfront-s3-event'),
        });
        */

        const logBucket = new Bucket(this, 'fit-nest-logs', {
            accessControl: BucketAccessControl.PRIVATE,
            objectOwnership: ObjectOwnership.OBJECT_WRITER,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            lifecycleRules: [{
                expiration: Duration.days(1)
            }]
        });
        // logBucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(cloudFrontLoggingLambda));
        const originWriteIdentity = new OriginAccessIdentity(this, 'CloudfrontS3LogsWriteIdentity');
        logBucket.grantWrite(originWriteIdentity);


        /*
        new Function(this, 'update-cognito-user-pool-details', {
          code: Code.fromAsset('crates/update-cognito-user-pool-details'),
          runtime: Runtime.PROVIDED_AL2,
          handler: 'not.required',
          environment: {
            RUST_BACKTRACE: '1'
          },
          logGroup: fitNestLogGroup
        });
        */

        // cloudfront distribution for the angular code.
        let distrobution = new Distribution(this, 'Distribution', {
            enableLogging: true, // todo - environment variables
            logBucket: logBucket, // todo - environment variables
            defaultRootObject: '/index.html',
            defaultBehavior: {
                origin: new S3Origin(content, {
                    originAccessIdentity: originAccessIdentity
                }),
                compress: false,
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: CachePolicy.CACHING_DISABLED
            },

            errorResponses: [
                {
                    httpStatus: 400,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html'
                },
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html'
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html'
                }
            ]
        });

        let applicationBaseUrl: string = 'https://' + distrobution.domainName;

        /*
         * Cognito
         */
        let fitNestUserPool = new UserPool(this, 'myuserpool', {
            userPoolName: 'fit-nest-cdk-dev-userpool',


            selfSignUpEnabled: false,
            userVerification: {
                emailSubject: 'Fit-Nest Registration',
                emailBody: 'Thank you for signing up with Fit-Nest, your code is {####}',
                emailStyle: VerificationEmailStyle.CODE
            },

            signInAliases: {
                username: false,
                email: true,
                preferredUsername: false
            },

            autoVerify: {
                email: true
            },

            standardAttributes: {
                birthdate: {
                    required: false, mutable: true
                },
                email: {
                    required: true, mutable: true
                },
                familyName: {
                    required: false, mutable: true
                },
                gender: {
                    required: false, mutable: true
                },
                givenName: {
                    required: false, mutable: true
                },
                locale: {
                    required: false, mutable: true
                },
                lastUpdateTime: {
                    required: false, mutable: true
                }
            },

            // Cognito post auth lambda function
            // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.Policy.html

            customAttributes: {
                'insurance': new StringAttribute({maxLen: 256, mutable: true}),
                'zipcode': new StringAttribute({minLen: 10, maxLen: 10, mutable: true}),
                'zip_code': new StringAttribute({minLen: 5, maxLen: 10, mutable: true}),
            },

            keepOriginal: {
                email: true
            },

            mfa: Mfa.OPTIONAL,
            mfaSecondFactor: {
                sms: false,
                otp: true
            },

            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: false,
                requireDigits: true,
                requireSymbols: true,
                tempPasswordValidity: Duration.days(3),
            },

            accountRecovery: AccountRecovery.EMAIL_ONLY,

            email: UserPoolEmail.withCognito('no-reply@fit-nest.com')
        });

        // TODO - setup IdentityPools for access management (derive a "ProfileCompleted") -

        const clientReadAttributes = new ClientAttributes().withStandardAttributes({
            birthdate: true,
            email: true,
            familyName: true,
            gender: true,
            givenName: true,
            locale: true,
            lastUpdateTime: true,
            emailVerified: true
        }).withCustomAttributes('insurance', 'zip_code');

        const fitNestUserPoolClient = fitNestUserPool.addClient('fit-nest-app-client', {
            authFlows: {
                userSrp: true
            },
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                },
                scopes: [
                    OAuthScope.PROFILE,
                    OAuthScope.EMAIL,
                    OAuthScope.OPENID,
                ],

                callbackUrls: [applicationBaseUrl, 'https://192.168.6.99:4200'], // todo - environment variables
                logoutUrls: [applicationBaseUrl, 'https://192.168.6.99:4200'], // todo - environment variables
            },

            preventUserExistenceErrors: true,

            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.COGNITO,
                // UserPoolClientIdentityProvider.GOOGLE,
                // UserPoolClientIdentityProvider.FACEBOOK,
                // UserPoolClientIdentityProvider.AMAZON,
                // UserPoolClientIdentityProvider.APPLE,
            ],

            authSessionValidity: Duration.minutes(3),

            accessTokenValidity: Duration.minutes(60),
            idTokenValidity: Duration.minutes(60),
            refreshTokenValidity: Duration.days(30),

            readAttributes: clientReadAttributes,
            // writeAttributes: [],

            enableTokenRevocation: true,

            // generateSecret: true
        });

        const cognitoUserPoolAuthorizer = new CognitoUserPoolsAuthorizer(this, 'cognito-user-pool-authorizer', {
            cognitoUserPools: [fitNestUserPool],
            identitySource: IdentitySource.header('authorization'),
            // resultsCacheTtl: Duration.seconds(0),
        });

        let fitNestDomain = fitNestUserPool.addDomain('CognitoDomain', {
            cognitoDomain: {
                domainPrefix: 'fit-nest-dev'
            }
        });

        // const clientId = client.userPoolClientId;
        // new UserPoolIdentityProviderGoogle(this, 'googleuserpool', {
        //   userPool: fitNestUserPool,
        //   clientId: clientId,
        //   clientSecretValue: client.userPoolClientSecret
        // });

        /*
         * DynamoDb
         */

        let refTableNames: string[] = [] // ['joints', 'motions'];
        let refTableMap: Map<string, Table> = new Map();
        refTableNames.forEach((refTableName: string) => {
            let table = new Table(this, refTableName, {
                billingMode: BillingMode.PAY_PER_REQUEST,
                partitionKey: {
                    name: `code`,
                    type: AttributeType.STRING,
                },
                removalPolicy: RemovalPolicy.DESTROY,
                tableName: refTableName
            });

            refTableMap.set(refTableName, table);
        });

        const profileTable = new TableV2(this, 'profile', {
            billing: Billing.onDemand(),
            partitionKey: {
                name: 'user_sub',
                type: AttributeType.STRING,
            },
            removalPolicy: RemovalPolicy.DESTROY,
        });


        const userSubIndexName = 'users_assessments';
        const assessmentsTable = new TableV2(this, 'assessments', {
            billing: Billing.onDemand(),
            partitionKey: {
                name: `id`,
                type: AttributeType.STRING,
            },
            removalPolicy: RemovalPolicy.DESTROY,

            globalSecondaryIndexes: [{
                indexName: userSubIndexName,
                partitionKey: {
                    name: 'user_sub',
                    type: AttributeType.STRING
                },
                projectionType: ProjectionType.ALL,
            }]
        });

        const questionnaireTable = new TableV2(this, 'questionnaires', {
            billing: Billing.onDemand(),
            partitionKey: {
                name: `id`,
                type: AttributeType.STRING,
            },
            removalPolicy: RemovalPolicy.DESTROY,

            globalSecondaryIndexes: [{
                indexName: userSubIndexName,
                partitionKey: {
                    name: 'user_sub',
                    type: AttributeType.STRING
                },
                projectionType: ProjectionType.ALL,
            }]
        });

        /*
        * API Gateway
        */

        const api = new RestApi(this, `Fit-Nest Mvp Api`, {
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                statusCode: 200
            },
            restApiName: `Fit-Nest Mvp Data Service`,
            cloudWatchRole: true,
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
                        fitNestUserPool.userPoolArn
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
                        profileTable.tableArn,

                        assessmentsTable.tableArn,
                        assessmentsTable.tableArn + `/index/${userSubIndexName}`,

                        questionnaireTable.tableArn,
                        questionnaireTable.tableArn + `/index/${userSubIndexName}`,
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
        distrobution.addBehavior('/api/*', new RestApiOrigin(api), {
            allowedMethods: AllowedMethods.ALLOW_ALL,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            compress: false,
            // cachePolicy: CachePolicy.CACHING_DISABLED,
            // cachePolicy: CachePolicy.AMPLIFY,
            cachePolicy: new CachePolicy(this, 'API Gateway Cache Policy', {
                headerBehavior: CacheHeaderBehavior.allowList('Authorization', 'Origin', 'Referer'),
                queryStringBehavior: CacheQueryStringBehavior.none(), // todo - environment variables
                cookieBehavior: CacheCookieBehavior.none(), // todo - environment variables
                defaultTtl: Duration.minutes(0),

                enableAcceptEncodingBrotli: false,
                enableAcceptEncodingGzip: false,
            }),
            originRequestPolicy: new OriginRequestPolicy(this, 'API Gateway Origin Policy', {
                headerBehavior: OriginRequestHeaderBehavior.none(), //allowList('Origin', 'Referer'),
                queryStringBehavior: OriginRequestQueryStringBehavior.all(),
                cookieBehavior: OriginRequestCookieBehavior.none(),
            }),
        });


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
              "TableName": "${assessmentsTable.tableName}",
              "IndexName": "${userSubIndexName}",
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
              "TableName": "${assessmentsTable.tableName}"
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
              "TableName": "${questionnaireTable.tableName}",
              "IndexName": "${userSubIndexName}",
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
              "TableName": "${questionnaireTable.tableName}"
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
             "UserPoolId": "${fitNestUserPool.userPoolId}"
          }`,
                },
            },
        });

        /**
         * Route53
         */
        // Route53

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
