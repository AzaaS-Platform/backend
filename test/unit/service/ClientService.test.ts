import { DatabaseAccessor } from '../../../src/database/DatabaseAccessor';
import { ClientService } from '../../../src/service/ClientService';
import { Client } from '../../../src/model/Client';
import { BadRequest } from '../../../src/error/BadRequest';

const INCORRECT_INSERTION = 'Incorrect insertion to database. Registering clients cannot overwrite.';

beforeEach(() => {
    process.env.STAGE = 'test';
    process.env.REGION = 'eu-central-1';
});

test('client service calls db when registering a new client', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const clientService = new ClientService(databaseAccessor);

    let putMethodCalledTimes = 0;
    const client = new Client('test-client-name', ['some-admin-user-id']);
    databaseAccessor.put = async (dbItem, overwrite): Promise<void> => {
        putMethodCalledTimes++;
        expect(dbItem).toEqual(client.toDbItem());
        if (overwrite) {
            fail(INCORRECT_INSERTION);
        }
    };

    // when
    const actual = await clientService.add(client);

    // then
    expect(actual).toEqual(client);
    expect(putMethodCalledTimes).toEqual(1);
});

test('client service throws an error when trying to add client without administrator account', async () => {
    // given
    const databaseAccessor = new DatabaseAccessor();
    const clientService = new ClientService(databaseAccessor);

    let putMethodCalledTimes = 0;
    const client = new Client('test-client-name', []);
    databaseAccessor.put = async (dbItem, overwrite): Promise<void> => {
        putMethodCalledTimes++;
        expect(dbItem).toEqual(client.toDbItem());
        if (overwrite) {
            fail(INCORRECT_INSERTION);
        }
    };

    // when
    const actual = clientService.add(client);

    // then
    await expect(actual).rejects.toEqual(new BadRequest('Cannot create Client without administrator account.'));
    expect(putMethodCalledTimes).toEqual(0);
});
