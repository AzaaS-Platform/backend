import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { RequestUtils } from './RequestUtils';
import { DatabaseAccessor } from '../database/DatabaseAccessor';
import { GroupService } from '../service/GroupService';
import { RequestParameterConstants } from './RequestParameterConstants';

export const get: APIGatewayProxyHandler = async (event, _context): Promise<APIGatewayProxyResult> => {
    try {
        const databaseAccessor = new DatabaseAccessor();
        const groupService = new GroupService(databaseAccessor);

        const map = RequestUtils.extractQueryStringParameters(event, [
            RequestParameterConstants.CLIENT,
            RequestParameterConstants.ID,
        ]);

        const group = groupService.getGroupByKey(
            map.get(RequestParameterConstants.CLIENT) as string,
            map.get(RequestParameterConstants.ID) as string,
        );
        return RequestUtils.buildResponse(JSON.stringify(group));
    } catch (e) {
        return RequestUtils.handleError(e);
    }
};
