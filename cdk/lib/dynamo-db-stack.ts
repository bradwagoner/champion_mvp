import * as cdk from 'aws-cdk-lib';
import {CfnOutput, RemovalPolicy} from 'aws-cdk-lib';
import {Construct} from "constructs";
import {AttributeType, Billing, ProjectionType, TableV2} from "aws-cdk-lib/aws-dynamodb";

interface DynamoDbStackProps {
    resourcePrefix: string;
}

export class DynamoDbStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: DynamoDbStackProps) {
        super(scope, id);

        /*
         * DynamoDb
         */

        // let refTableNames: string[] = [] // ['joints', 'motions'];
        // let refTableMap: Map<string, Table> = new Map();
        // refTableNames.forEach((refTableName: string) => {
        //     let table = new Table(this, refTableName, {
        //         billingMode: BillingMode.PAY_PER_REQUEST,
        //         partitionKey: {
        //             name: `code`,
        //             type: AttributeType.STRING,
        //         },
        //         removalPolicy: RemovalPolicy.DESTROY,
        //         tableName: refTableName
        //     });
        //
        //     refTableMap.set(refTableName, table);
        // });

        // const profileTable = new TableV2(this, 'profile', {
        //     billing: Billing.onDemand(),
        //     partitionKey: {
        //         name: 'user_sub',
        //         type: AttributeType.STRING,
        //     },
        //     removalPolicy: RemovalPolicy.DESTROY,
        // });


        const assessmentsUserSubIndex = 'users_assessments';
        const assessmentsTable = new TableV2(this, 'assessments', {
            billing: Billing.onDemand(),
            partitionKey: {
                name: `id`,
                type: AttributeType.STRING,
            },
            removalPolicy: RemovalPolicy.DESTROY,

            globalSecondaryIndexes: [{
                indexName: assessmentsUserSubIndex,
                partitionKey: {
                    name: 'user_sub',
                    type: AttributeType.STRING
                },
                projectionType: ProjectionType.ALL,
            }]
        });

        new CfnOutput(this, props.resourcePrefix + "AssessmentsTableNameOutput", {
            value: assessmentsTable.tableName,
            exportName: "AssessmentsTableName"
        });
        new CfnOutput(this, props.resourcePrefix + "AssessmentsTableArnOutput", {
            value: assessmentsTable.tableArn,
            exportName: "AssessmentsTableArn"
        });
        new CfnOutput(this, props.resourcePrefix + "AssessmentsTableUserSubIndexOutput", {
            value: assessmentsUserSubIndex,
            exportName: "AssessmentsTableUserSubIndex"
        });

        const questionnaireUserSubIndex = 'users_questionnaires';
        const questionnaireTable = new TableV2(this, 'questionnaires', {
            billing: Billing.onDemand(),
            partitionKey: {
                name: `id`,
                type: AttributeType.STRING,
            },
            removalPolicy: RemovalPolicy.DESTROY,

            globalSecondaryIndexes: [{
                indexName: questionnaireUserSubIndex,
                partitionKey: {
                    name: 'user_sub',
                    type: AttributeType.STRING
                },
                projectionType: ProjectionType.ALL,
            }]
        });

        new CfnOutput(this, props.resourcePrefix + "QuestionnaireTableNameOutput", {
            value: questionnaireTable.tableName,
            exportName: "QuestionnaireTableName"
        });
        new CfnOutput(this, props.resourcePrefix + "QuestionnaireTableArnOutput", {
            value: questionnaireTable.tableArn,
            exportName: "QuestionnaireTableArn"
        });
        new CfnOutput(this, props.resourcePrefix + "QuestionnaireTableUserSubIndexOutput", {
            value: questionnaireUserSubIndex,
            exportName: "QuestionnaireTableUserSubIndex"
        });
    }
}