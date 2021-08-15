import { SubscribeMessage, 
	WebSocketGateway, 
	OnGatewayInit, 
	OnGatewayConnection,
	OnGatewayDisconnect,
	ConnectedSocket,
	WebSocketServer, 
	MessageBody} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io'
import { RoomInterface, SetupInterface } from './interfaces/game.interface'
import { GameService } from './game.service';

/**
 * TO DO: 	- Rajouter le lien avec la base de données pour les spectateurs (notamment comment on join 
 * 			  la room, dans handle connection).
 * 			- Update les logs pour qu'on fasse la diff entre un player qui join et un spectateur.
 * 			- Gerer le emit room closed.
 * 			- Mieux gerer les cas de deconnexion et de changement de vue.
 */

@WebSocketGateway({ cors: true, namespace: 'game' })
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect 
{
	constructor(private gameService: GameService) {};
	private logger: Logger = new Logger('GameGateway');
	private intervalId: NodeJS.Timer;
	
	@WebSocketServer() wss: Socket;

	afterInit(server: Server): void {
		this.logger.log('Init done');
	}

	// The new client will join a room. If 2 players in a room, will then emit x milliseconds
	// all the game positions, and frontend will render the game using those coordinates.
	handleConnection(@ConnectedSocket() client: Socket): void
	{
		this.logger.log(`Client connected:\t\tclient id:\t${client.id}`);

		let room: RoomInterface = this.gameService.joinRoom(client.id, false);
		this.logger.log(`Room joined:\t\tclient id:\t${client.id} (room id: ${room.name})`);

		client.join(room.name);
		client.emit('joinRoom', { clientId: client.id, room });

		if (room.nbPeopleConnected === 2)
		{
			// Clients will render the setup screen and they will be able to choose match
			// options for x seconds.
			this.intervalId = setInterval(() => {
				this.wss.to(room.name).emit('actualizeSetupScreen', { clientId: client.id, room });
			}, this.gameService.FRAMERATE);
			
			// Stop to emit gameSetup event after x seconds.
			new Promise<void> ((resolve) => {
				setTimeout(() => {
					clearInterval(this.intervalId);
					resolve();
				}, this.gameService.TIME_GAME_SETUP);	

			// Display the match parameters choose by the player for x seconds.
			}).then(() => {
				return new Promise<void> ((resolve) => {
					this.gameService.chooseGameSetup(client.id);
					this.wss.to(room.name).emit('displaySetupChoose', { clientId: client.id, room });

					setTimeout(() => {
						resolve();
					}, this.gameService.TIME_DISPLAY_SETUP_CHOOSE);
				});

			// Once gameSetup emitting is stopped, the game starts and clients will render it.
			}).then(() => {
				this.wss.to(room.name).emit('startingGame', { clientId: client.id, room });

				this.intervalId = setInterval(() => {
					this.wss.to(room.name).emit('actualizeGameScreen', { clientId: client.id, room });
					
					// Case somebody won.
					if (this.gameService.updateGame(room))
					{
						clearInterval(this.intervalId);
						this.wss.to(room.name).emit('gameEnded', { clientId: client.id, room });
						this.logger.log(`Game won:\t\tclient id:\t${client.id} (room id: ${room.name})`);
						this.gameService.removeRoom(client.id);
					}
				}, this.gameService.FRAMERATE);
			});

		}
	}

	// If a player click on another option, updating his choice to all people in the room.
	@SubscribeMessage('updateGameSetup')
	handleUpdateGameSetup(@ConnectedSocket() client: Socket, @MessageBody() setup: SetupInterface) : void
	{
		let room: RoomInterface = this.gameService.updateGameSetup(client.id, setup);
		this.wss.to(room.name).emit('gameSetupUpdated', { clientId: client.id, room });
	}

	// Update player's paddle position when a player mooves his mouse.
	@SubscribeMessage('pongEvent')
	handlePongEvent(@ConnectedSocket() client: Socket, @MessageBody() event: any): void
	{
		this.gameService.updatePlayerPos(client, event);
	}

	// Emit to disconnect everybody in the room if one of the two players disconnect from the game
	// (including people spectating).
	handleDisconnect(@ConnectedSocket() client: Socket): void
	{
		this.logger.log(`Client disconnected:\tclient id:\t${client.id}`);
		let room: RoomInterface = this.gameService.findRoomByPlayerId(client.id);
		
		if (room && room.name)
		{
			clearInterval(this.intervalId);
			this.wss.to(room.name).emit('opponentLeft', { clientId: client.id, room: room });
			this.gameService.removeRoom(client.id);
		}
	}
	
	// When a player leaves the game vue, he will emit disconnectClient the server will emit 'opponentLeft'
	// event to the room making everybode leave the room. If a spectator leaves the vue, 
	// just disconnecting him from the server.
	@SubscribeMessage('disconnectClient')
	handleDisconnectClient(@ConnectedSocket() client: Socket): void
	{
		let room: RoomInterface = this.gameService.findRoomByPlayerId(client.id);
		
		if (room)
		{
			clearInterval(this.intervalId);
			this.wss.to(room.name).emit('opponentLeft', { clientId: client.id, room: room });
			this.logger.log(`Room has been left:\tplayer id:\t${client.id} (room id: ${room.name})`);
			this.gameService.removeRoom(client.id);
		}
		else
		this.logger.log(`Room has been left:\spectator id:\t${client.id}`);
		
		client.disconnect();
	}

	// Client leaves the room.
	@SubscribeMessage('opponentLeft')
	handleOpponentLeft(@ConnectedSocket() client: Socket, @MessageBody() room: RoomInterface): void
	{
		client.leave(room.name);
		this.logger.log(`Room has been left:\tclient id:\t${client.id} (room id: ${room.name})`);
	}
};