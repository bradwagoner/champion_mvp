import * as cdk from 'aws-cdk-lib';
import {CfnOutput, Duration, Fn} from 'aws-cdk-lib';
import {Construct} from "constructs";
import {
    AllowedMethods,
    CacheCookieBehavior,
    CacheHeaderBehavior,
    CachePolicy,
    CacheQueryStringBehavior,
    Distribution,
    OriginRequestCookieBehavior,
    OriginRequestHeaderBehavior,
    OriginRequestPolicy,
    OriginRequestQueryStringBehavior,
    ViewerProtocolPolicy
} from "aws-cdk-lib/aws-cloudfront";
import {RestApiOrigin, S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {ARecord, RecordTarget} from "aws-cdk-lib/aws-route53";
import {CfnRestApi, RestApi} from "aws-cdk-lib/aws-apigateway";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";

interface CertificateStackProps {
    resourcePrefix: string;
    domainName: string;
}

interface Route53CfnStackProps {
    resourcePrefix: string;
    domainName: string;
    certificateArn: string;
    hostedZoneId: string;
}

export class Route53CfnStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: Route53CfnStackProps) {
        super(scope, id, {
            env: {region: 'us-east-1'}
        });

        // WORKING! - I think - disabled because re-create was failing on bucket errors.
        // const logBucket = new Bucket(this, 'fit-nest-logs', {
        //     accessControl: BucketAccessControl.PRIVATE,
        //     objectOwnership: ObjectOwnership.OBJECT_WRITER,
        //     removalPolicy: RemovalPolicy.DESTROY,
        //     autoDeleteObjects: true,
        //     lifecycleRules: [{
        //         expiration: Duration.days(1)
        //     }]
        // });
        // // logBucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(cloudFrontLoggingLambda));
        // const originWriteIdentity = new OriginAccessIdentity(this, 'CloudfrontS3LogsWriteIdentity');
        // logBucket.grantWrite(originWriteIdentity);

        // cloudfront distribution for the angular code.
        let distribution = new Distribution(this, props.resourcePrefix + 'ContentCloudFrontDistribution', {
            // enableLogging: true, // todo - environment variables
            // logBucket: logBucket, // todo - environment variables
            domainNames: [`www.${props.domainName}`, props.domainName],
            certificate: certificate,
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

        const api = RestApi.fromRestApiId(this, props.resourcePrefix + 'RestApiReference', Fn.importValue(props.resourcePrefix + 'RestApiId'));
        CfnRestApi


        distribution.addBehavior('/api/*', new RestApiOrigin(api), {
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

        new ARecord(this, props.resourcePrefix + 'StaticContentARecord', {
            target: RecordTarget.fromAlias(new CloudFrontTarget(contentCloudFrontDistribution)),
            zone: zone,
        });

        new CfnOutput(this, props.resourcePrefix + "ContentCloudFrontDistributionOutput", {
            value: contentCloudFrontDistribution.distributionId,
            exportName: "ContentCloudFrontDistributionId"
        });

    }
}