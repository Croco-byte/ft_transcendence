/* eslint-disable prettier/prettier */
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
		if (client.data && client.data.userId) {
			console.log("Client with ID " + client.data.userId + " disconnecting from status websocket server");
			await this.userService.changeUserStatus(client.data.userId, 'offline');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'offline' });
		}
	}

	async handleConnection(client: Socket, args: any[]) {
		try {
			const user = await this.authService.validateToken(client.handshake.query.token as string);
			console.log("Client with ID " + user.id + " connecting to status websocket server");
			client.data = { userId: user.id, username: user.username };
			if (user.status !== "offline") { this.wss.emit('multipleConnectionsOnSameUser', { userId: user.id }); }
			else {
				await this.userService.changeUserStatus(client.data.userId, 'online');
				this.wss.emit('statusChange', { userId: client.data.userId, status: 'online' });
			}
		} catch(e) {
			console.log("Unauthorized client trying to connect");
			client.disconnect();
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('getOnline')
	async handleOnline(client: Socket, data: any): Promise<void> {
		try {
			await this.userService.changeUserStatus(client.data.userId, 'online');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'online' });
		} catch(e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('getOffline')
	async handleOffline(client: Socket, data: any): Promise<void> {
		try {
			await this.userService.changeUserStatus(client.data.userId, 'offline');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'offline' });
		} catch(e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('getInGame')
	async handleInGame(client: Socket, data: any): Promise<void> {
		try {
			await this.userService.changeUserStatus(client.data.userId, 'in-game');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'in-game' });
		} catch (e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('getInQueue')
	async handleInQueue(client: Socket, data: any): Promise<void> {
		try {
			await this.userService.changeUserStatus(client.data.userId, 'in-queue');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'in-queue' });
		} catch (e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('getSpectating')
	async handleSpectating(client: Socket, data: any): Promise<void> {
		try {
			await this.userService.changeUserStatus(client.data.userId, 'spectating');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'spectating' });
		} catch (e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}


	@UseGuards(WsJwtGuard)
	@SubscribeMessage('checkForJWTChanges')
	async verifyAccountUnicity(client: Socket, data: any): Promise<void> {
		if (data.currUserId !== client.data.userId) {
			this.wss.emit('multipleConnectionsOnSameUser', { userId: data.currUserId })
			client.disconnect();
		}
	}
}
