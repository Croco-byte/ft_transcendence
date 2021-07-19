import {
		SubscribeMessage,
		WebSocketGateway,
		OnGatewayInit,
		WebSocketServer,
		OnGatewayConnection,
		OnGatewayDisconnect,
	} from '@nestjs/websockets';
	import { Logger } from '@nestjs/common';
	import { Socket, Server } from 'socket.io';

	@WebSocketGateway(3001)
	export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
	{
		@WebSocketServer() server: Server;
	
		private logger: Logger = new Logger('AppGateway');
		private clients: any[];

		constructor()
		{
			this.clients = new Array();
		}
	
		@SubscribeMessage('send_message')
		handleMessage(client: Socket, data: any): void
		{
			this.logger.log("Receive : " + JSON.stringify(data));
			this.server.emit('send_message', JSON.stringify({author: "NestJS", content: data.content}));
		}
	
		afterInit(server: Server)
		{
			this.logger.log('Init');
		}
	
		handleDisconnect(client: Socket)
		{
			const index = this.clients.indexOf(client);
			if (index > -1)
				this.clients.splice(index, 1);
			this.logger.log(`Client disconnected: ${client.id} - ` + this.clients.length + ' clients connected');
		}
	
		handleConnection(client: Socket, ...args: any[])
		{
			for (let i = 0; i < 5; i++)
			{
				client.join("channel_" + i);
				console.log(client.rooms);
			}
			this.clients.push(client);
			this.logger.log(`Client connected: ${client.id} - ` + this.clients.length + ' clients connected');
		}
	}
	