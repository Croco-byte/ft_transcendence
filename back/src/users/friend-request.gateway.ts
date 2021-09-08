import { Logger, UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { WsJwtGuard } from '../auth/ws-jwt-strategy'
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from './users.service';

/* This is the Gateway that handles friendrequests. It allows to :
** >> Accept, decline, or send a friendrequest, unfriend a user
** >> Each time a user accepts, declines, sends a friendrequest, or unfriend a user, a message is sent to all other users, with the IDs of the two user concerned
*/

@WebSocketGateway({ cors: true, namespace: '/friendRequests' })
export class FriendRequestsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

	constructor(private readonly authService: AuthService, private readonly userService: UsersService) {}

	@WebSocketServer() wss: Server;
	private logger: Logger = new Logger('FriendRequestsGateway');

	afterInit(server: any) {
		this.logger.log("The FriendRequests Gatway is initialized")
	}

	handleDisconnect(client: any) {
			this.logger.log(`Client disconnected to FriendRequests Gateway. ${client.id}`)
	}


	async handleConnection(client: Socket, args: any[]) {
		try {
			const user = await this.authService.validateToken(client.handshake.query.token as string);
			this.logger.log(`Client connected to FriendRequests Gateway. ${client.id}`);
		} catch(e) {
			client.disconnect();
			this.logger.log("Unauthorized client trying to connect to the websocket. Bouncing him.")
		}
		
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('acceptFriendRequest')
	async handleAcceptFriendRequest(client: Socket, data: { friendRequestId: number, user: { id: number, username: string } }): Promise<void> {
		try {
			const result = await this.userService.respondToFriendRequest(data.friendRequestId, "accepted");
			this.wss.emit('friendStatusChanged', { creatorId: result.creator.id, receiverId: result.receiver.id });
			client.emit('friendRequestConfirmation', { type: "accept", message: "Friend request successfully accepted" });
		} catch(e) {
			client.emit('friendRequestError', { type: "accept", message: "Something wrong happened while accepting request. Please try again later" });
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('declineFriendRequest')
	async handleDeclineFriendRequest(client: Socket, data: { friendRequestId: number, user: { id: number, username: string } }): Promise<void> {
		try {
			const result = await this.userService.respondToFriendRequest(data.friendRequestId, "declined");
			this.wss.emit('friendStatusChanged', { creatorId: result.creator.id, receiverId: result.receiver.id });
			client.emit('friendRequestConfirmation', { type: "decline", message: "Friend request successfully declined" });
		} catch(e) {
			client.emit('friendRequestError', { type: "decline", message: "Something wrong happened while declining request. Please try again later" });
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('sendFriendRequest')
	async handleSendFriendRequest(client: Socket, data: { receiverId: number, user: { id: number, username: string } }) {
		try {
			const result = await this.userService.sendFriendRequest(data.receiverId, data.user.id);
			this.wss.emit('friendStatusChanged', { creatorId: result.creator.id, receiverId: result.receiver.id });
			client.emit('friendRequestConfirmation', { type: "send", message: "Friend request successfully sent" });
		} catch(e) {
			client.emit('friendRequestError', { type: "send", message: e.message });
		}

	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('unfriendUser')
	async handleUnfriendUser(client: Socket, data: { friendId: number, user: { id: number, username: string } }): Promise<void> {
		try {
			const result = await this.userService.unfriendUser(data.user.id, data.friendId);
			this.wss.emit('friendStatusChanged', result);
			client.emit('friendRequestConfirmation', { type: "unfriend", message: "User successfully unfriended" });
		} catch(e) {
			client.emit('friendRequestError', { type: "unfriend", message: "Something wrong happened while unfriending. Please try again later" });
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('cancelFriendRequest')
	async handleCancelFriendRequest(client: Socket, data: { receiverId: number, user: { id: number, username: string } }): Promise<void> {
		try {
			const result = await this.userService.cancelFriendRequest(data.user.id, data.receiverId);
			this.wss.emit('friendStatusChanged', result);
			client.emit('friendRequestConfirmation', { type: "cancel", message: "Friend request successfully canceled" });
		} catch(e) {
			client.emit('friendRequestError', { type: "cancel", message: "Something wrong happened while canceling friend request. Please try again later" });
		}
	}
}
