import { Logger, UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { WsJwtGuard } from '../auth/ws-jwt-strategy'
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from './users.service';

/* This is the gateway that handles the users status.
** When the user connects to the gateway, his ID is stored in the client Socket object.
** When the Socket object disconnects, the user that started the connection is set "offline" (--> the user closed the window of the app)
** The handleOnline function allows to set a user online. If the user was already online, we send a message to all users that indicates
** multiple connections on our current user, and disconnects this user on every windows.
*/

@WebSocketGateway({ cors: true, namespace: '/connectionStatus' })
export class StatusGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

	constructor(private readonly authService: AuthService, private readonly userService: UsersService) {}

	@WebSocketServer() wss: Server;
	private logger: Logger = new Logger('StatusGateway');

	afterInit(server: any) {
		this.logger.log("The Status Gatway is initialized")
	}

	async handleDisconnect(client: any) {
		this.logger.log(`Client disconnected from Status Gateway ${client.id}`)
		if (client.data && client.data.userId) {
			await this.userService.changeUserStatus(client.data.userId, 'offline');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'offline' });
		}
	}

	async handleConnection(client: Socket, args: any[]) {
		try {
			const user = await this.authService.validateToken(client.handshake.query.token as string);
			client.data = { userId: user.id, username: user.username };
			this.logger.log(`Client connected to Status Gateway ${client.id}`);
		} catch(e) {
			console.log("Unauthorized client trying to connect");
			client.disconnect();
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('getOnline')
	async handleOnline(client: Socket, data: any): Promise<void> {
		try {
			console.log("Status of the user trying to connect : " + data.user.status + " | " + typeof(data.user.status));
			if (data.user.status !== "offline") {
				this.wss.emit('multipleConnectionsOnSameUser', { userId: client.data.userId });
			} else {
				await this.userService.changeUserStatus(client.data.userId, 'online');
				this.wss.emit('statusChange', { userId: client.data.userId, status: 'online' });
			}
		} catch(e) {
			console.log(e.message);
			throw new WsException(e.message);
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('getOffline')
	async handleOffline(client: Socket, data: any): Promise<void> {
		try {
			console.log("Emitting status change offline signal");
			await this.userService.changeUserStatus(client.data.userId, 'offline');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'offline' });
		} catch(e) {
			console.log(e.message);
			throw new WsException(e.message);
		}
	}
}
