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
	private CLIENTS=[];

	@WebSocketServer() wss: Server;
	private logger: Logger = new Logger('StatusGateway');

	afterInit(server: any) {
		this.logger.log("The Status Gatway is initialized")
	}

	async handleDisconnect(client: any) {
		var userWasInGame = false;
		for (var i = 0; i < this.CLIENTS.length; i++) {
			if (this.CLIENTS[i].clientId === client.id) {
				if (this.CLIENTS[i].status === "in-game" || this.CLIENTS[i].status === "in-queue") userWasInGame = true;
				this.CLIENTS.splice(i, 1);
				break;
			}
		}
		console.log("A client disconnected. All clients connected : ");
		for (var i = 0; i < this.CLIENTS.length; i++) {
			console.log(this.CLIENTS[i].clientId + " | " + this.CLIENTS[i].userId + " | " + this.CLIENTS[i].status);
		}
		if (!this.CLIENTS.find(object => object["userId"] === client.data.userId)) {
			await this.userService.changeUserStatus(client.data.userId, 'offline');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'offline' });
		}
		else if (userWasInGame) {
			await this.userService.changeUserStatus(client.data.userId, 'online');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'online' });

		}
	}

	async handleConnection(client: Socket, args: any[]) {
		try {
			const user = await this.authService.validateToken(client.handshake.query.token as string);
			client.data = { clientId: client.id, userId: user.id, username: user.username };
			this.CLIENTS.push({ "clientId": client.id, "userId": user.id, "status": "online" });
			if (user.status === "offline") {
				await this.userService.changeUserStatus(client.data.userId, 'online');
				this.wss.emit('statusChange', { userId: client.data.userId, status: 'online' });
			}
			
			console.log("A client connected. All clients connected : " );
			for (var i = 0; i < this.CLIENTS.length; i++) {
			console.log(this.CLIENTS[i].clientId + " | " + this.CLIENTS[i].userId + " | " + this.CLIENTS[i].status);
		}
		} catch(e) {
			this.logger.log("Unauthorized client trying to connect");
			client.disconnect();
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('getOnline')
	async handleOnline(client: Socket, data: any): Promise<void> {
		try {
			for (var i = 0; i < this.CLIENTS.length; i++) {
				if (this.CLIENTS[i].userId === client.data.clientId) { this.CLIENTS[i].status = "online"; break; }
			}
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
			for (var i = 0; i < this.CLIENTS.length; i++) {
				if (this.CLIENTS[i].clientId === client.data.clientId) { this.CLIENTS[i].status = "offline"; break; }
			}
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
			for (var i = 0; i < this.CLIENTS.length; i++) {
				if (this.CLIENTS[i].clientId === client.data.clientId) { this.CLIENTS[i].status = "in-game"; break; }
			}
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
			for (var i = 0; i < this.CLIENTS.length; i++) {
				if (this.CLIENTS[i].clientId === client.data.clientId) { this.CLIENTS[i].status = "in-queue"; break; }
			}
			await this.userService.changeUserStatus(client.data.userId, 'in-queue');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'in-queue' });
		} catch (e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}
}
