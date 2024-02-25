import * as cdk from 'aws-cdk-lib';
import {CfnOutput} from 'aws-cdk-lib';
import {Construct} from "constructs";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";

interface CertificateStackProps {
    resourcePrefix: string;
    domainName: string;
}
export class CertificateStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: CertificateStackProps) {
        super(scope, id, {
            env: {region: 'us-east-1'}
        });

        const hostedZoneCertificate = new Certificate(this, props.resourcePrefix + 'R53Certificate', {
            domainName: props.domainName,
            subjectAlternativeNames: [`www.${props.domainName}`],
            validation: CertificateValidation.fromDns(),
        });
        new CfnOutput(this, props.resourcePrefix + 'R53CertificateArn', {
            value: hostedZoneCertificate.certificateArn,
        })
    }
}