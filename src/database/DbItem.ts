import { InternalServerError } from '../error/InternalServerError';
import { DbMappingConstants } from './DbMappingConstants';

export class DbItem {
    constructor(private item: { [key: string]: any }) {
        if (this.has(DbMappingConstants.CLIENT)) {
            this.snapOnSeparator();
        }
    }

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

    private snapOnSeparator(): void {
        const separator = (this.item[DbMappingConstants.CLIENT] as string).lastIndexOf(
            DbMappingConstants.TYPE_SEPARATOR,
        );
        if (separator !== -1) {
            this.item[DbMappingConstants.CLIENT] = (this.item[DbMappingConstants.CLIENT] as string).substring(
                0,
                separator,
            );
        }
    }
}
