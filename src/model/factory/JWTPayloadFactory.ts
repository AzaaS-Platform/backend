import { JWTPayload } from '../tokens/JWTPayload';
import moment from 'moment';

export class JWTPayloadFactory {
    private static JWT_EXPIRATION_TIME = 15;
    // public static fromJWT(jwt: string): JWTPayload {
    //     return new JWTPayload(null, null, null, null);
    // }

    public static from(client: string, userId: string, permissions: Array<string>): JWTPayload {
        return new JWTPayload(
            client,
            userId,
            permissions,
            moment(new Date())
                .add(this.JWT_EXPIRATION_TIME, 'm')
                .toDate(),
        );
    }
}
