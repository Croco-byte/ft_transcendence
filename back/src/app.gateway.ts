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
	private clients: any[];

	constructor(private readonly channelService: ChannelService,
				private readonly authService: AuthService,
				private readonly userService: UsersService,
				private readonly messageService: MessageService)
	{
		this.clients = new Array();
	}

	@SubscribeMessage('message')
	async handleMessage(client: Socket, data: any)
	{
		// Verifier que l utilisateur est dans le channel de la requete et qu il n est pas mute ou ban
		this.logger.log("Receive : " + JSON.stringify(data));
	}

	async sendNewMessage(room: string, msg: Object)
	{
		this.server.to(room).emit('message', msg);
	}

	afterInit(server: Server)
	{
		this.logger.log('Init');
	}

	test(arg)
	{
		this.logger.log(this.clients);
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
		if (!user) { client.emit('unauthorized', {}); return; }
		// Récupérer les channels ou l user est présent et les joins

		this.clients[client.id] = user;
		for (let i = 0; i < user.channels.length; i++)
		{
			let channel = user.channels[i];
			client.join("channel_" + channel.id);
		}

		console.log("[Chat Gateway] User connected to chat gateway : " + client.id + "Total clients connected : " + Object.keys(this.clients).length);
	}

	async leaveChannel(channel: Channel, user: User)
	{
		let sockID = null;
		for (let key in this.clients)
		{
			if (this.clients[key].username == user.username)
			{
				sockID = key;
				break ;
			}
		}
		delete this.server.sockets.adapter.rooms["channel_" + channel.id].sockets[sockID];
	}

	async joinChannel(channel: Channel, user: User)
	{
		let sockID = null;
		for (let key in this.clients)
		{
			if (this.clients[key].username == user.username)
			{
				sockID = key;
				break ;
			}
		}
		this.server.sockets.adapter.rooms["channel_" + channel.id].sockets[sockID] = true;
	}
}
