import {
		SubscribeMessage,
		WebSocketGateway,
		OnGatewayInit,
		WebSocketServer,
		OnGatewayConnection,
		OnGatewayDisconnect,
	}
	from '@nestjs/websockets';
import { Injectable, Logger, Query, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import ChannelService from './channels/channel.service';
import { Channel } from './channels/channel.entity';
import { User } from './users/users.entity';
import { UsersService } from './users/users.service';
import MessageService from './messages/message.service';
import JwtTwoFactorGuard from './auth/jwt-two-factor-auth.guard';
import { AuthService } from './auth/auth.service';
import { WsJwtGuard } from './auth/ws-jwt-strategy';

@Injectable()
@WebSocketGateway({ cors: true, namespace: 'chat' })
@UseGuards(WsJwtGuard)
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer() server: Server;

	private logger: Logger = new Logger('AppGateway');
	private clients: any[] = new Array();

	constructor(private readonly channelService: ChannelService,
				private readonly authService: AuthService,
				private readonly userService: UsersService,
				private readonly messageService: MessageService)
	{

	}

	@SubscribeMessage('message')
	async handleMessage(client: Socket, data: any)
	{
		// Verifier que l utilisateur est dans le channel de la requete et qu il n est pas mute ou ban
		this.logger.log("Receive : " + JSON.stringify(data));
	}

	async sendNewMessage(room: string, msg: Object, user: User, channel: Channel)
	{
		let unauthaurizedUsers : User[] = [];
		let blockedUsers = await this.userService.getBiDirectionalBlockedUsers(user);
		unauthaurizedUsers.concat(blockedUsers);
		unauthaurizedUsers.concat(channel.pending_users);

		for (let unauthorized of unauthaurizedUsers)
		{
			let socket = this.getSocketByUser(unauthorized);
			if (socket)
				socket.leave(room);
		}
		this.server.to(room).emit('message', msg);
		for (let unauthorized of unauthaurizedUsers)
		{
			let socket = this.getSocketByUser(unauthorized);
			if (socket)
				socket.join(room);
		}
	}

	afterInit(server: Server)
	{
		this.logger.log('Init');
	}

	handleDisconnect(client: Socket)
	{
		let user = this.clients[client.id];
		//this.logger.log(`Client disconnected: ${user.username} -  ${Object.keys(this.clients).length - 1} clients connected`);
		delete this.clients[client.id];
	}

	async handleConnection(client: Socket, ...args: any[])
	{
		try
		{
			const user = await this.authService.validateToken(client.handshake.query.token as string);
			client.data = { userId: user.id, username: user.username };
			this.logger.log(`Client connected to Status Gateway. User ID: ${client.data.userId}`);
		}
		catch(e)
		{
			client.disconnect();
			this.logger.log("Unauthorized client trying to connect to the websocket. Bouncing him.");
			throw new UnauthorizedException();
		}
		// Récupérer les channels ou l user est présent et les joins
		let user = await this.userService.findById(client.data.userId);
		this.clients[client.id] = [user, client];
		for (let i = 0; i < user.channels.length; i++)
		{
			let channel = user.channels[i];
			client.join("channel_" + channel.id);
		}

		this.logger.log(`Client connected: ${user.username} - ${client.id} -  ${Object.keys(this.clients).length} clients connected`);
	}

	async leaveChannel(channel: Channel, user: User)
	{
		let sockID = null;
		let socket : Socket = null;
		for (let key in this.clients)
		{
			if (this.clients[key][0].username == user.username)
			{
				sockID = key;
				socket = this.clients[key][1];
				break ;
			}
		}
		socket.leave("channel_" + channel.id);
		//delete this.server.sockets.adapter.rooms["channel_" + channel.id].sockets[sockID];
	}

	async joinChannel(channel: Channel, user: User)
	{
		let sockID = null;
		let socket: Socket = null;
		for (let key in this.clients)
		{
			if (this.clients[key][0].username == user.username)
			{
				sockID = key;
				socket = this.clients[key][1];
				break ;
			}
		}
		socket.join("channel_" + channel.id);
		// this.server.sockets.adapter.rooms["channel_" + channel.id].sockets[sockID] = true;
	}

	getSocketByUser(search: User): Socket
	{
		for (let arr of this.clients.entries())
		{
			let val = arr[1];
			let user = val[0];
			if (user.id == search.id)
				return val[1];
		}
		return null;
	}
}
