import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {StaticContentStack} from "./static-content-stack";
import {CognitoStack} from "./cognito-stack";
import {DynamoDbStack} from "./dynamo-db-stack";
import {ApiGatewayStack} from "./apiGatewayStack/api-gateway-stack";

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const resourcePrefix = 'fitnest-dev-';

        const cloudfrontDomain: string = 'fitnest.fitness';
        const cloudfrontCertificateArn = 'arn:aws:acm:us-east-1:194136998506:certificate/a46c7575-0f01-4229-8bdf-c818e0847974';
        const apiDomain: string = 'api.fitnest.fitness';
        const apiCertificateArn = 'arn:aws:acm:us-east-2:194136998506:certificate/e85ebcec-eb44-4214-b637-a8d1e7097aab';
        const idpDomain: string = 'idp.fitnest.fitness';
        const idpCertificateArn = 'arn:aws:acm:us-east-1:194136998506:certificate/778084ed-d3ed-4474-8c81-4fff92e04e42';

        const userPoolClientCallbackUrls = [
            `https://www.${cloudfrontDomain}`,
            `https://${cloudfrontDomain}`,
            'https://192.168.6.99:4200' // todo - environment variables
        ];

        let stackOptions = {
            resourcePrefix: resourcePrefix,
        }

        new CognitoStack(this, resourcePrefix + 'CognitoStack', {
            ...stackOptions,
            domainName: idpDomain,
            certificateArn: idpCertificateArn,
            hostedZoneId: 'Z0717072D0RVMZZH5TU3',
            callbackUrls: userPoolClientCallbackUrls,
        });

        new DynamoDbStack(this, resourcePrefix + 'DynamoDbStack', stackOptions);

        // new ApiGatewayStack(this, resourcePrefix + 'ApiGatewayStack', {
        //     ...stackOptions,
        //     domainName: cloudfrontDomain,
        //     hostedZoneId: 'Z03167451CUCFT14RAJEH',
        //     certificateArn: cloudfrontCertificateArn,
        //     // certificateArn: apiCertificateArn,
        //     // hostedZoneId: 'Z08267081KYQP91GHZF8J',
        // });
        //
        // API Stack currently mashed into static content stack because I don't know how to break out the routing / domain / CloudFront config
        new StaticContentStack(this, resourcePrefix + 'StaticContentStack', {
            ...stackOptions,
            domainName: cloudfrontDomain,
            hostedZoneId: 'Z03167451CUCFT14RAJEH',
            certificateArn: cloudfrontCertificateArn,
        });


        // Route53CfnStack might be a way to break out routing / domain / CF but I couldn't get working references to the API from another stack.
    }
}