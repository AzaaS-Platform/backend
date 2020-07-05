import { InternalServerError } from '../error/InternalServerError';
import { DbMappingConstants } from './DbMappingConstants';

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
}
