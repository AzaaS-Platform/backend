import { DynamoDB } from 'aws-sdk';

export class TestUtils {
    static arrayToDdbStringSet(array: Array<string>): DynamoDB.DocumentClient.StringSet {
        return {
            type: 'String',
            values: array,
            wrapperName: 'Set',
        } as DynamoDB.DocumentClient.StringSet;
    }
}
