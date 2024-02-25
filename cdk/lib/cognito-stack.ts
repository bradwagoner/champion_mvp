import * as cdk from 'aws-cdk-lib';
import {CfnOutput, Duration} from 'aws-cdk-lib';
import {Construct} from "constructs";
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
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {UserPoolDomainTarget} from "aws-cdk-lib/aws-route53-targets";

interface CognitoStackProps {
    resourcePrefix: string;
    domainName: string;
    certificateArn: string;
    hostedZoneId: string;
    callbackUrls: string[];
}


export class CognitoStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: CognitoStackProps) {
        super(scope, id);

        const zone = HostedZone.fromHostedZoneAttributes(this, props.resourcePrefix + 'CognitoHostedZoneReference', {
            hostedZoneId: props.hostedZoneId,
            zoneName: props.domainName,
        });

        /*
         * Cognito
         */
        let fitNestUserPool = new UserPool(this, 'myuserpool', {
            userPoolName: 'fit-nest-cdk-dev-userpool',

            selfSignUpEnabled: false, // TODO: https://github.com/bradwagoner/champion_mvp/issues/20
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
                'zipcode': new StringAttribute({minLen: 10, maxLen: 10, mutable: true}), // TODO - get ri dof me next time we nuke n pave.
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

            email: UserPoolEmail.withCognito('no-reply@fit-nest.com'),
        });

        new CfnOutput(this, props.resourcePrefix + "UserPoolId", {
            value: fitNestUserPool.userPoolId,
            exportName: "UserPoolId"
        });
        new CfnOutput(this, props.resourcePrefix + "UserPoolArn", {
            value: fitNestUserPool.userPoolArn,
            exportName: "UserPoolArn"
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

        fitNestUserPool.addClient(props.resourcePrefix + 'fit-nest-app-client', {
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

                callbackUrls: props.callbackUrls,
                logoutUrls: props.callbackUrls,
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
            refreshTokenValidity: Duration.hours(12),

            readAttributes: clientReadAttributes,
            // writeAttributes: [],

            enableTokenRevocation: true,


            // generateSecret: true
        });

        const certificate = Certificate.fromCertificateArn(this, props.resourcePrefix + 'IdpCertificate', props.certificateArn);
        // const userPoolDomain = new UserPoolDomain(this, props.resourcePrefix + 'UserPoolReference', {
        //     userPool: fitNestUserPool,
        //     customDomain: {
        //         domainName: props.domainName,
        //         certificate: certificate,
        //     }
        // });

        const userPoolDomain = fitNestUserPool.addDomain(props.resourcePrefix + 'UserPoolDomain', {
            customDomain: {
                domainName: props.domainName,
                certificate: certificate,
            }
        });

        new ARecord(this, props.resourcePrefix + 'StaticContentARecord', {
            target: RecordTarget.fromAlias(new UserPoolDomainTarget(userPoolDomain)),
            zone: zone,
        });
    }
}