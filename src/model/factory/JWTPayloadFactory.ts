import { JWTPayload } from '../tokens/JWTPayload';
import * as jwt from 'jsonwebtoken';
import { BadRequest } from '../../error/BadRequest';

export class JWTPayloadFactory {
    public static fromToken(token: string): JWTPayload {
        const decodedJwt = jwt.decode(token) as { [p: string]: any };
        if (decodedJwt === null || decodedJwt['payload'] === null) {
            throw new BadRequest('Incorrect JWT payload.');
        }
        const payload: JWTPayload = decodedJwt['payload'];
        return new JWTPayload(payload.clt, payload.usr);
    }
    public static from(client: string, userId: string): JWTPayload {
        return new JWTPayload(client, userId);
    }
}
