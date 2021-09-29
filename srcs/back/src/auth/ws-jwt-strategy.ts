import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { AuthService } from './auth.service'
import { User } from 'src/users/users.entity'

/* This is the AuthGuard for WebSockets.
** It simply verifies the JWT Token passed with the query, and injects in the data of the message
** the object "user" that contains, among other, the ID and username.
** Warning : we CAN'T use this Guard on "handleConnection" functions of websockets. You'Il have to call validateToken manually (see status.gateway.ts)
*/

@Injectable()
export class WsJwtGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		try {
			const client: Socket = context.switchToWs().getClient<Socket>();
			const access_token: string | string[] = client.handshake.query.token as string;
			const user: User = await this.authService.validateToken(access_token);
			context.switchToWs().getData().user = user;
			return Boolean(user);
		} catch(err) {
			console.log("Encountered an error : " + err.message);
			throw new WsException(err.message);
		}
	}

}

