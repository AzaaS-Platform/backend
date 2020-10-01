import { ClientRequestDto } from '../dto/request/ClientRequestDto';
import { Client } from '../Client';
import { ClientResponseDto } from '../dto/response/ClientResponseDto';
import { v4 as UUID } from 'uuid';
import { DbItem } from '../../database/DbItem';
import { DbMappingConstants as DB } from '../../database/DbMappingConstants';

/**
 * {@class ClientFactory} always returns Client without filled in admin users.
 * DbItem is an exception.
 */
export class ClientFactory {
    static fromDto(client: string, clientRequestDto: ClientRequestDto): Client {
        return new Client(client, clientRequestDto.name as string, []);
    }

    static fromDtoNew(clientRequestDto: ClientRequestDto): Client {
        return new Client(UUID(), clientRequestDto.name as string, []);
    }

    static fromDbItem(item: DbItem): Client {
        return new Client(item.get(DB.CLIENT), item.get(DB.CLIENT_NAME), item.get(DB.ADMIN_USERS));
    }

    static toResponse(client: Client | null): ClientResponseDto | any {
        if (client === null) return {};
        return new ClientResponseDto(client.client, client.name, client.adminUsers);
    }
}
