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

	handleDisconnect(client: any) {
		if (client.data) {
			this.logger.log(`Client disconnected from Status Gateway. User ID: ${client.data.userId}`)
			if (client.data) this.wss.emit('userOffline', client.data.userId);
			if (client.data) this.userService.changeUserStatus(client.data.userId, 'offline');
		}
		else {
			this.logger.log(`Client disconnected from Status Gateway: ${client.id}`)
		}
	}

	async handleConnection(client: Socket, args: any[]) {
		try {
			const user = await this.authService.validateToken(client.handshake.query.token as string);
			client.data = { userId: user.id, username: user.username };
			this.logger.log(`Client connected to Status Gateway. User ID: ${client.data.userId}`);
		} catch(e) {
			client.disconnect();
			console.log("Unauthorized client trying to connect to the websocket. Bouncing him.")
		}
		
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('getOnline')
	handleOnline(client: Socket, data: any): void {
		try {
			this.userService.changeUserStatus(client.data.userId, 'online');
			this.wss.emit('userOnline', client.data.userId);
		} catch(e) {
			throw new WsException(e.message);
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('getOffline')
	handleOffline(client: Socket, data: any): void {
		try {
			this.userService.changeUserStatus(client.data.userId, 'offline');
			this.wss.emit('userOffline', client.data.userId);
		} catch(e) {
			throw new WsException(e.message);
		}
	}
}
