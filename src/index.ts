import {DynamoDB} from 'aws-sdk';

const client: DynamoDB = new DynamoDB();
const hw: string = "Hello world!\n";

console.log(hw + JSON.stringify(client));
