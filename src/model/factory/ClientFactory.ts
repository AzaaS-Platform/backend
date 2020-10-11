import { ClientRequestDto } from '../dto/request/ClientRequestDto';
import { Client } from '../Client';
import { ClientResponseDto } from '../dto/response/ClientResponseDto';
import { DbItem } from '../../database/DbItem';
import { DbMappingConstants as DB } from '../../database/DbMappingConstants';

/**
 * {@class ClientFactory} always returns Client without filled in admin users.
 * DbItem is an exception.
 */
export class ClientFactory {
    static fromDto(clientRequestDto: ClientRequestDto): Client {
        return new Client(clientRequestDto.name as string, []);
    }

    static fromDtoNew(clientRequestDto: ClientRequestDto): Client {
        return new Client(clientRequestDto.name as string, []);
    }

    static fromDbItem(item: DbItem): Client {
        return new Client(item.get(DB.CLIENT), item.get(DB.ADMIN_USERS));
    }

    static toResponse(client: Client | null): ClientResponseDto | any {
        if (client === null) return {};
        return new ClientResponseDto(client.client, client.adminUsers);
    }
}
