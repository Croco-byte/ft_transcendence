import { Logger, UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { WsJwtGuard } from '../auth/ws-jwt-strategy'
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from './users.service';
import { User } from './users.entity';

/* This is the Gateway that handles friendrequests. It allows to :
** >> Accept, decline, or send a friendrequest, unfriend a user
** >> Each time a user accepts, declines, sends a friendrequest, or unfriend a user, a message is sent to all other users, with the IDs of the two user concerned
*/

@WebSocketGateway({ cors: true, namespace: '/friendRequests' })
export class FriendRequestsGateway implements OnGatewayConnection, OnGatewayDisconnect {

	constructor(private readonly authService: AuthService, private readonly userService: UsersService) {}

	@WebSocketServer() wss: Server;
	private logger: Logger = new Logger('FriendRequestsGateway');

	handleDisconnect(client: any) {
			console.log("[FriendRequest Gateway] Client disconnected from gateway : " + client.id);
	}


	async handleConnection(client: Socket, args: any[]) {
			const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
			if (!user) { client.emit('unauthorized', { message: "Session expired !" }); return; }
			if (user.is_blocked) { client.emit('unauthorized', { message: "User is blocked from website" }); return; }
	
			console.log("[FriendRequest Gateway] Client connected to gateway : " + client.id);
	}

	@SubscribeMessage('acceptFriendRequest')
	async handleAcceptFriendRequest(client: Socket, data: { friendRequestId: number }): Promise<void> {
		try {
			const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
			if (!user) { client.emit('unauthorized', { message: "Session expired !" }); return; }
			if (user.is_blocked) { client.emit('unauthorized', { message: "User is blocked from website" }); return; }

			const result = await this.userService.respondToFriendRequest(data.friendRequestId, "accepted");
			this.wss.emit('friendStatusChanged', { creatorId: result.creator.id, receiverId: result.receiver.id });
			client.emit('friendRequestConfirmation', { type: "accept", message: "Friend request successfully accepted" });
		} catch(e) {
			client.emit('friendRequestError', { type: "accept", message: "Something wrong happened while accepting request. Please try again later" });
		}
	}

	@SubscribeMessage('declineFriendRequest')
	async handleDeclineFriendRequest(client: Socket, data: { friendRequestId: number }): Promise<void> {
		try {
			const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
			if (!user) { client.emit('unauthorized', { message: "Session expired !" }); return; }
			if (user.is_blocked) { client.emit('unauthorized', { message: "User is blocked from website" }); return; }

			const result = await this.userService.respondToFriendRequest(data.friendRequestId, "declined");
			this.wss.emit('friendStatusChanged', { creatorId: result.creator.id, receiverId: result.receiver.id });
			client.emit('friendRequestConfirmation', { type: "decline", message: "Friend request successfully declined" });
		} catch(e) {
			client.emit('friendRequestError', { type: "decline", message: "Something wrong happened while declining request. Please try again later" });
		}
	}

	@SubscribeMessage('sendFriendRequest')
	async handleSendFriendRequest(client: Socket, data: { receiverId: number }) {
		try {
			const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
			if (!user) { client.emit('unauthorized', { message: "Session expired !" }); return; }
			if (user.is_blocked) { client.emit('unauthorized', { message: "User is blocked from website" }); return; }
			
			const result = await this.userService.sendFriendRequest(data.receiverId, user.id);
			this.wss.emit('friendStatusChanged', { creatorId: result.creator.id, receiverId: result.receiver.id });
			client.emit('friendRequestConfirmation', { type: "send", message: "Friend request successfully sent" });
		} catch(e) {
			client.emit('friendRequestError', { type: "send", message: e.message });
		}
	}

	@SubscribeMessage('unfriendUser')
	async handleUnfriendUser(client: Socket, data: { friendId: number }): Promise<void> {
		try {
			const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
			if (!user) { client.emit('unauthorized', { message: "Session expired !" }); return; }
			if (user.is_blocked) { client.emit('unauthorized', { message: "User is blocked from website" }); return; }

			const result = await this.userService.unfriendUser(user.id, data.friendId);
			this.wss.emit('friendStatusChanged', result);
			client.emit('friendRequestConfirmation', { type: "unfriend", message: "User successfully unfriended" });
		} catch(e) {
			client.emit('friendRequestError', { type: "unfriend", message: "Something wrong happened while unfriending. Please try again later" });
		}
	}

	@SubscribeMessage('cancelFriendRequest')
	async handleCancelFriendRequest(client: Socket, data: { receiverId: number }): Promise<void> {
		try {
			const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
			if (!user) { client.emit('unauthorized', { message: "Session expired !" }); return; }
			if (user.is_blocked) { client.emit('unauthorized', { message: "User is blocked from website" }); return; }

			const result = await this.userService.cancelFriendRequest(user.id, data.receiverId);
			this.wss.emit('friendStatusChanged', result);
			client.emit('friendRequestConfirmation', { type: "cancel", message: "Friend request successfully canceled" });
		} catch(e) {
			client.emit('friendRequestError', { type: "cancel", message: "Something wrong happened while canceling friend request. Please try again later" });
		}
	}
}
