import { Logger, UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { WsJwtGuard } from '../auth/ws-jwt-strategy'
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from './users.service';

@WebSocketGateway({ namespace: '/connectionStatus' })
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
			this.wss.emit('userOffline', client.data.userId);
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
			console.log("User ID: " + data.user.id + " | User status: " + data.user.status);
			if (data.user.status !== "offline") {
				this.wss.emit('multipleConnectionsOnSameUser', { userId: client.data.userId });
			} else {
				await this.userService.changeUserStatus(client.data.userId, 'online');
				this.wss.emit('userOnline', client.data.userId);
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
			await this.userService.changeUserStatus(client.data.userId, 'offline');
			this.wss.emit('userOffline', client.data.userId);
		} catch(e) {
			throw new WsException(e.message);
		}
	}
}
