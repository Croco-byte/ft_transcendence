/* eslint-disable prettier/prettier */
import { SubscribeMessage, 
	WebSocketGateway, 
	OnGatewayInit, 
	OnGatewayConnection,
	OnGatewayDisconnect,
	ConnectedSocket,
	WebSocketServer, 
	MessageBody,
	WsException} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io'
import { Room, 
    Setup } from './interfaces/game.interface'
import { GameService } from './game.service';
import { UsersService } from '../users/users.service'
import { AuthService } from '../auth/auth.service';
import { User } from 'src/users/users.entity';

@WebSocketGateway({ cors: true, namespace: 'game' })
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect 
{
	constructor(
		private readonly gameService: GameService,
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
		) {};
	private logger: Logger = new Logger('GameGateway');
	private intervalId: NodeJS.Timer;
	
	@WebSocketServer() wss: Socket;

	afterInit(server: Server): void 
	{
		this.logger.log('Init done');
	}

	/**
	 * Add database id to client object. If the user is has status set to 'spectating', makes him
	 * join the correct room.
	 * 
	 * @param client Will be updated with database id for this user (client.data.userDbId).
	 */
	async handleConnection(@ConnectedSocket() client: Socket): Promise<void>
	{
		try {
			const user: User | null = await this.authService.customWsGuard(client.handshake.query.token as string);
			if (!user) { client.emit('unauthorized', {}); return; }
			
			client.data = { userDbId: user.id, userStatus: user.status };
			console.log("[Game Gateway] Client connected to gateway : " + client.id);
		} 
		catch(e) {
			this.logger.log('[Game Gateway] Unauthorized client trying to connect');
			client.disconnect();
		}

		if (client.data.userStatus === 'spectating') {
			const room: Room = await this.gameService.attributeRoom(client.data.userDbId, client.id);
			client.join(room.name);
		}
	}

	/**
	 * When an user disconnect, reset in database his roomId. If it was a player,
	 * emits to everybody from its room to indicate that game is over and removes the room.
	 * 
	 * @param client Need to contain user db id (client.data.userDbId).
	 */
	async handleDisconnect(@ConnectedSocket() client: Socket): Promise<void>
	{
		console.log("[Game Gateway] Client connected to gateway : " + client.id);
		
		let room: Room = this.gameService.findRoomByPlayerId(client.id);
		const user = await this.usersService.findUserById(client.data.userDbId)
		clearInterval(this.intervalId);

		if (room && client.data.wasInGame) {
			await this.gameService.updateScores(this.wss, room, client.id);
		}
		
		else if (room && room.player2Id != '') {
			this.wss.to(room.name).emit('resetMatchmaking');
			this.gameService.removeRoom(this.wss, room);
		}
		
		else if (room)
			this.gameService.removeRoom(this.wss, room);

		else
			await this.usersService.updateRoomId(client.data.userDbId, 'none');
	}

	/**
	 * Connects the player to a room after it has chosen its game setup option, and when
	 * a room is fulfilled with two players, launches the game.
	 * Game will be proceed as following:
	 * 		- Displays a waiting screen until another player is matched.
	 * 		- Runs the game.
	 * 		- Displays end screen when a player won the game or one disconnect.
	 * 		- Updates scores and stats in database.
	 * 
	 * @param client Socket object with user information.
	 * @param setupChosen Setup chosen by the player.
	 */
	@SubscribeMessage('setupChosen')
	async handleSetupChosen(@ConnectedSocket() client: Socket, @MessageBody() setupChosen: Setup) : Promise<void>
	{
		let room: Room = await this.gameService.attributeRoom(client.data.userDbId, client.id, setupChosen);
		client.join(room.name);

		this.logger.log(`room.player2Id = ${room.player2Id}`);

		if (room.player2Id === '')
			client.emit('waitingForPlayer');
		
		else if (room.player2Id != '') {

			this.wss.to(room.name).emit('startingGame', false);
			await new Promise(resolve => setTimeout(resolve, this.gameService.TIME_MATCH_START));
			this.wss.to(room.name).emit('startingGame', true);

			// To prevent to launch the game if one player left during starting game screen
			if (this.gameService.findRoomByPlayerId(client.id))
			{
				await new Promise<void>((resolve) => {
					this.intervalId = setInterval(async () => {
		
						this.wss.to(room.name).emit('actualizeGameScreen', room);
		
						if (this.gameService.updateGame(room)) {
							clearInterval(this.intervalId);
							resolve();
						}
					}, this.gameService.FRAMERATE);
				});
				
				await this.gameService.updateScores(this.wss, room);
			}
		}
	}

	/**
	 * Updates player's paddle position accordingly to its mouse position.
	 * 
	 * @param client Socket object with user information.
	 * @param playerPosY Paddle will be move to this position.
	 */
	@SubscribeMessage('pongEvent')
	handlePongEvent(@ConnectedSocket() client: Socket, @MessageBody() playerPosY: number): void
	{
		this.gameService.updatePlayerPos(client.id, playerPosY);
	}
	
	/**
	 * Disconnects the client when it leaves the game vue.
	 * 
	 * @param client Socket object with user information.
	 * @param boolean True if the player was playing, false if it was in-queue.
	 */
	@SubscribeMessage('disconnectClient')
	handleDisconnectClient(@ConnectedSocket() client: Socket, @MessageBody() wasInGame: boolean): void
	{
		client.data.wasInGame = wasInGame;
		client.disconnect();
	}
};
