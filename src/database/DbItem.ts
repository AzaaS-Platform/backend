import { InternalServerError } from '../error/InternalServerError';
import { DbMappingConstants } from './DbMappingConstants';
import { DynamoDB } from 'aws-sdk';

/**
 * DbItem should include type suffix! E.g. User item -> 1234-5678-9012-3456:user
 *
 */
export class DbItem {
    constructor(private item: { [key: string]: any }) {}

    public get(key: string): any {
        if (this.item[key] === undefined) {
            throw new InternalServerError(
                `item ${this.item[DbMappingConstants.CLIENT] ?? 'ID-NOT-FOUND'} has no field ${key}`,
            );
        } else {
            return this.item[key];
        }
    }

    public has(key: string): boolean {
        return this.item[key] !== undefined;
    }

    public getMap(): { [key: string]: any } {
        return this.item;
    }

    // these two methods don't mutate state, they return a new object
    public unwrapSets(): DbItem {
        const modified = this.copy();
        for (const itemKey in modified.item) {
            if (modified.item[itemKey].wrapperName) {
                modified.item[itemKey] = modified.item[itemKey].values;
            }
        }
        return modified;
    }

    public wrapSets(): DbItem {
        const modified = this.copy();
        for (const itemKey in modified.item) {
            if (Array.isArray(modified.item[itemKey])) {
                modified.item[itemKey] = {
                    type: 'String',
                    values: modified.item[itemKey],
                    wrapperName: 'Set',
                } as DynamoDB.DocumentClient.StringSet;
            }
        }
        return modified;
    }

    private copy(): DbItem {
        return new DbItem(JSON.parse(JSON.stringify(this.item)));
    }
}
