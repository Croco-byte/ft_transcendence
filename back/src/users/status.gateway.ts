/* eslint-disable prettier/prettier */
import { Logger, OnModuleDestroy, UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { getConnection } from 'typeorm';

/* This is the gateway that handles the users status.
** When the user connects to the gateway, his ID is stored in the client Socket object.
** When the Socket object disconnects, the user that started the connection is set "offline" (--> the user closed the window of the app)
** The handleOnline function allows to set a user online. If the user was already online, we send a message to all users that indicates
** multiple connections on our current user, and disconnects this user on every windows.
*/

@WebSocketGateway({ cors: true, namespace: '/connectionStatus' })
export class StatusGateway implements OnModuleDestroy, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

	constructor(private readonly authService: AuthService, private readonly userService: UsersService) {}
	
	async onModuleDestroy() {
		this.wss.emit('serverDown', {});
		await getConnection()
					.createQueryBuilder()
					.update(User)
					.set({ status: "offline" })
					.execute();
	}

	@WebSocketServer() wss: Server;
	private logger: Logger = new Logger('StatusGateway');

	afterInit(server: any) {
		this.logger.log("The Status Gatway is initialized")
	}

	async handleDisconnect(client: any) {
		if (client.data && client.data.userId) {
			console.log("[Status Gateway] Client disconnected from gateway : " + client.data.userId);
			await this.userService.changeUserStatus(client.data.userId, 'offline');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'offline' });
		}
	}

	async handleConnection(client: Socket, args: any[]) {
		const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
		if (!user) { client.emit('unauthorized', {}); return; }
			
		try {
			console.log("[Status Gateway] Client connected to gateway : " + user.id);
			client.data = { userId: user.id, username: user.username };
			if (user.status !== "offline") { this.wss.emit('multipleConnectionsOnSameUser', { userId: user.id }); }
			else {
				await this.userService.changeUserStatus(client.data.userId, 'online');
				this.wss.emit('statusChange', { userId: client.data.userId, status: 'online' });
			}
		} catch(e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}

	@SubscribeMessage('getOnline')
	async handleOnline(client: Socket, data: any): Promise<void> {
		const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
		if (!user) { client.emit('unauthorized', {}); return; }
		
		try {
			await this.userService.changeUserStatus(client.data.userId, 'online');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'online' });
			this.logger.log('status changed to online');
		} catch(e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}

	@SubscribeMessage('getOffline')
	async handleOffline(client: Socket, data: any): Promise<void> {
		const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
		if (!user) { client.emit('unauthorized', {}); return; }

		try {
			await this.userService.changeUserStatus(client.data.userId, 'offline');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'offline' });
			this.logger.log('status changed to offline');
		} catch(e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}

		/* Note : even if the JWT token is expired, if the player is already connected to the Game Gateway, he can get in queue and play a game. */
	@SubscribeMessage('getInGame')
	async handleInGame(client: Socket, data: any): Promise<void> {
		try {
			await this.userService.changeUserStatus(client.data.userId, 'in-game');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'in-game' });
			this.logger.log('status changed to ingame');
		} catch (e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}

	@SubscribeMessage('getInQueue')
	async handleInQueue(client: Socket, data: any): Promise<void> {
		try {
			await this.userService.changeUserStatus(client.data.userId, 'in-queue');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'in-queue' });
			this.logger.log('status changed to in-queue');
		} catch (e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}

	@SubscribeMessage('getSpectating')
	async handleSpectating(client: Socket, data: any): Promise<void> {
		const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
		if (!user) { client.emit('unauthorized', {}); return; }
		
		try {
			await this.userService.changeUserStatus(client.data.userId, 'spectating');
			this.wss.emit('statusChange', { userId: client.data.userId, status: 'spectating' });
			this.logger.log('status changed to spectating');
		} catch (e) {
			this.logger.log(e.message);
			throw new WsException(e.message);
		}
	}


	@SubscribeMessage('checkForJWTChanges')
	async verifyAccountUnicity(client: Socket, data: any): Promise<void> {
		if (data.currUserId !== client.data.userId) {
			this.wss.emit('multipleConnectionsOnSameUser', { userId: data.currUserId })
			client.disconnect();
		}
	}
}
