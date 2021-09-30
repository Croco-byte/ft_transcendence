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
import ChannelService from './channel.service';
import { Channel } from './channel.entity';
import { User } from '../users/users.entity';
import { UsersService } from '../users/users.service';
import MessageService from '../messages/message.service';
import JwtTwoFactorGuard from '../auth/jwt-two-factor-auth.guard';
import { AuthService } from '../auth/auth.service';
import { WsJwtGuard } from '../auth/ws-jwt-strategy';

@Injectable()
@WebSocketGateway({ cors: true, namespace: 'chat' })
@UseGuards(WsJwtGuard)
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect
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

	async sendNewMessage(room: string, msg: Object, user: User, channel: Channel)
	{
		let unauthorizedUsers : User[] = [];
		let blockedUsers = await this.userService.getBiDirectionalBlockedUsers(user);
		unauthorizedUsers = unauthorizedUsers.concat(blockedUsers);
		unauthorizedUsers = unauthorizedUsers.concat(channel.pending_users);

		for (let unauthorized of unauthorizedUsers)
		{
			let socket = this.getSocketByUser(unauthorized);
			if (socket)
				socket.leave(room);
		}
		this.server.to(room).emit('message', msg);
		for (let unauthorized of unauthorizedUsers)
		{
			let socket = this.getSocketByUser(unauthorized);
			if (socket)
				socket.join(room);
		}
	}

	async kickMember(user: User, channel: Channel)
	{
		let socket = this.getSocketByUser(user);
		if (socket)
			socket.emit("kicked", {channel_id: channel.id, msg:"You have been kicked from channel '" + channel.name + "'"});
	}

	async addMember(room: string, msg: string, channel: Channel)
	{
		let unauthorizedUsers = channel.pending_users;

		for (let unauthorized of unauthorizedUsers)
		{
			let socket = this.getSocketByUser(unauthorized);
			if (socket)
				socket.leave(room);
		}
		this.server.to(room).emit('new_member', msg);
		for (let unauthorized of unauthorizedUsers)
		{
			let socket = this.getSocketByUser(unauthorized);
			if (socket)
				socket.join(room);
		}
	}

	async notifChannel(room: string, notif: string, msg:string, channel: Channel)
	{
		let unauthorizedUsers = channel.pending_users;

		for (let unauthorized of unauthorizedUsers)
		{
			let socket = this.getSocketByUser(unauthorized);
			if (socket)
				socket.leave(room);
		}
		this.server.to(room).emit(notif, msg);
		for (let unauthorized of unauthorizedUsers)
		{
			let socket = this.getSocketByUser(unauthorized);
			if (socket)
				socket.join(room);
		}
	}

	handleDisconnect(client: Socket)
	{
		let user = this.clients[client.id];
		console.log("[Chat Gateway] User disconnected from chat gateway : " + client.id);
		delete this.clients[client.id];
	}

	async handleConnection(client: Socket, ...args: any[])
	{
		const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
		if (!user) { client.emit('unauthorized', { message: "Session expired !" }); return; }
		if (user.is_blocked) { client.emit('unauthorized', { message: "User is blocked from website" }); return; }
		// Récupérer les channels ou l user est présent et les joins
		this.clients[client.id] = [user, client];

		for (let i = 0; i < user.channels.length; i++)
		{
			let channel = user.channels[i];
			client.join("channel_" + channel.id);
		}

		console.log("[Chat Gateway] " + user.username + " connected to chat gateway : " + client.id + "Total clients connected : " + Object.keys(this.clients).length);
	}

	async leaveChannel(channel: Channel, user: User)
	{
		let socket : Socket = null;
		socket = this.getSocketByUser(user);
		if (socket)
			socket.leave("channel_" + channel.id);
	}

	joinChannel(channel: Channel, user: User)
	{
		let socket: Socket = null;
		socket = this.getSocketByUser(user)
		if (socket)
		{
			socket.join("channel_" + channel.id);
		}
	}

	getSocketByUser(search: User): Socket
	{
		let keys = Object.keys(this.clients);

		for (let key of keys)
		{
			let val = this.clients[key];
			let user = val[0];
			if (user.id == search.id)
				return val[1];
		}
		return null;
	}

	createChannel()
	{
		this.server.emit("channel_created", {});
	}

	changeType(channel: Channel)
	{
		this.server.emit("channel_type_changed", {channel_id: channel.id, type: channel.type})
	}

	destroyChannel(channelID: string, users: User[], name: string)
	{
		this.server.emit("channel_destroyed", {channel_id: parseInt(channelID), msg: "Channel " + name + " has been destroyed."});
		for (let user of users)
		{
			let socket = this.getSocketByUser(user);
			if (socket)
				socket.leave("channel_" + channelID);
		}
	}

	activePassword(channel: Channel)
	{
		this.server.emit("channel_password_actived", { channel_id: channel.id });
	}

	deletePassword(channel: Channel)
	{
		this.server.emit("channel_password_deleted", {channel_id: channel.id});
	}
}
