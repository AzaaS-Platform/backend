import { ClientRequestDto } from '../dto/request/ClientRequestDto';
import { Client } from '../Client';
import { DbItem } from '../../database/DbItem';
import { DbMappingConstants as DB } from '../../database/DbMappingConstants';

/**
 * {@class ClientFactory} always returns Client without filled in admin users.
 * DbItem is an exception.
 */
export class ClientFactory {
    static fromDtoNew(clientRequestDto: ClientRequestDto): Client {
        return new Client(clientRequestDto.name as string, clientRequestDto.name as string, [], []);
    }

    static fromDbItem(item: DbItem): Client {
        return new Client(
            item.get(DB.CLIENT),
            item.get(DB.ENTITY),
            item.get(DB.ADMIN_USERS),
            ClientFactory.getAllowedUrlsArray(item),
        );
    }

    private static getAllowedUrlsArray(item: DbItem): Array<string> {
        if (!item.has(DB.ALLOWED_URLS)) {
            return new Array<string>();
        } else {
            return item.get(DB.ALLOWED_URLS);
        }
    }
}
