/* eslint-disable prettier/prettier */
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
import { RoomInterface, 
    SetupInterface } from './interfaces/game.interface'
import { GameService } from './game.service';
import { UsersService } from '../users/users.service'
import { AuthService } from '../auth/auth.service';
import { resolve } from 'path';

/**
 * HOW IT WORKS:
 * 
 * ---------------------------------------------------------------------------------------------------------------
 * EMETTERS COTE BACK (dans leur ordre d'apparition):
 * 
 * - 'joinRoom' (1 FOIS) : SocketDataInterface
 *	>>>	Quand quelqu'un se connecte pour la premiere fois à l'onglet game. Correspond
 *		au 'waiting another player'. Seul le joueur 1 recevra cet event (permet de l'identifier).
 *		On peut checker le nombre de joueurs dans la room dans obj.room.nbPeopleConnected.
 * 
 * - 'actualizeSetupScreen' (INTERVAL) : RoomInterface
 *	>>> Envoie l'objet toutes les x ms avec les choix actuels des options pour joueur 1 et joueur 2.
 *		Permet ainsi de faire un rendu en direct des choix actuels des joueurs. Cette evenement dure
 *		quelques secondes (defini par la constante 'TIME_GAME_SETUP' dans game.service.ts). Si joueur 1
 *		ou joueur 2 clique sur une autre option, l'objet 'SocketDataInterface' sera update par le listener
 *		'updateGameSetup'.
 *		
 * - 'displaySetupChoose' (1 FOIS) : RoomInterface
 * 	>>> Envoie une seule fois l'objet 'SocketDataInterface' avec les options finales du jeu retenues pour
 * 		la game à venir. Si P1 et P2 n'avait pas choisi les mêmes options, la plus petite option est retenue
 * 		(ex: P1 a choisi easy, P2 a choisi medium >>> easy sera retenue).
 * 
 * - 'startingGame' (1 FOIS) (peut-etre useless cet event ?) : RoomInterface
 * 	>>> Indique que la partie va commencer. Permet de stop de display les options choisies et d'indiquer 
 * 		le jeu va pouvoir etre display.
 * 
 * - 'actualizeGameScreen' (INTERVAL) : RoomInterface
 * 	>>>	Envoie l'objet toutes les x ms avec les nouvelles positions de la balle et des paddle. Les positions 
 * 		des paddles peuvent etre update par le listener 'pongEvent'.
 * 
 * - 'gameEnded' (1 FOIS) : RoomInterface
 * 	>>> Envoie l'objet avec les scores finaux. Indique que la parte est terminée, arrete l'animation du jeu
 * 		et déclenche le rendu de l'écran de victoire. 
 * 
 * - 'opponentLeft' (1 FOIS) : SocketDataInterface
 * 	>>> Permet juste d'indiquer que 1 des 2 joueurs principaux vient de deconnecter de la partie. Entraine la
 * 		fin du jeu et la victoire par abandon de l'autre joueur (on display donc le screen de victoire). 
 * 		!!! VOIR COMMENT ON PEUT MIEUX GERER SI LE JOUEUR DECO PENDANT LE SETUP DE LA GAME
 * 
 * 
 * ---------------------------------------------------------------------------------------------------------------
 * LISTENERS COTE BACK (dans leur ordre d'apparition):
 * 
 * - 'updateGameSetup' (@MessageBody() setup: SetupInterface)
 * 	>>> Update l'objet setup qui est envoyé par interval regulier par l'emetteur back 'actualizeSetupScreen' lorsqu'un 
 * 		joueur clique sur une option differente.
 * 
 * - 'pongEvent' (@MessageBody() playerPosY: number)
 * 	>>> L'objet event contient un x et un y, permet d'update la position du joueur pendant que le jeu a lieu.
 * 
 * - 'disconnectClient' (pas de body)
 * 	>>> Survient quand un joueur dans le front change d'onglet. Cela provoque un arret du jeu, + le back emet 'opponentLeft' 
 * 		a tous les gens dans la room afin de deconnecter de la room tout le monde correctement.
 * 
 */

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
	 * Connects the user to a room, and when a room is fulfilled with two players, launches the game.
	 * Game will be proceed as following:
	 * 		- Allows players to choose game options for x seconds.
	 * 		- Displays options choosed during x seconds.
	 * 		- Runs the game.
	 * 		- Displays end screen when a player won the game or one disconnect.
	 * 
	 * @param client Will be updated with database id for this user (client.data.userDbId).
	 */
	async handleConnection(@ConnectedSocket() client: Socket): Promise<void>
	{
		try {
			const user = await this.authService.validateToken(client.handshake.query.token as string);
			client.data = { userDbId: user.id, gameStatus: user.gameStatus };
			this.logger.log(`Client connected (client id: ${client.id})`);
		} 
		catch(e) {
			this.logger.log('Unauthorized client trying to connect');
			client.disconnect();
		}

		if (client.data.gameStatus === 'spectating')
			this.gameService.attributeRoom(client.data.userDbId, client.id);

		// spectate

		// let room: RoomInterface = await this.gameService.joinRoom(client.data.userDbId, client.id);
		
		// client.join(room.name);
		// this.logger.log(`Room joined (client id: ${client.id}, room id: ${room.name})`);
		
		// if (room.nbPeopleConnected === 1)
		// 	client.emit('joinRoom', { clientId: client.id, room });

		// else if (room.nbPeopleConnected === 2)
		// {
		// 	// Clients will render the setup screen and they will be able to choose match
		// 	// options for x seconds.
		// 	this.intervalId = setInterval(() => {
		// 		this.wss.to(room.name).emit('actualizeSetupScreen', room);
		// 	}, this.gameService.FRAMERATE);
			
		// 	// Stop to emit gameSetup event after x seconds.
		// 	new Promise<void> ((resolve) => {
		// 		setTimeout(() => {
		// 			clearInterval(this.intervalId);
		// 			resolve();
		// 		}, this.gameService.TIME_GAME_SETUP);	

		// 	// Display the match parameters choose by the player for x seconds.
		// 	}).then(() => {
		// 		return new Promise<void> ((resolve) => {
		// 			this.gameService.chooseGameSetup(room);
		// 			this.wss.to(room.name).emit('displaySetupChoose', room);

		// 			setTimeout(() => {
		// 				resolve();
		// 			}, this.gameService.TIME_DISPLAY_SETUP_CHOOSE);
		// 		});

		// 	// Once gameSetup emitting is stopped, the game starts and clients will render it.
		// 	}).then(() => {
		// 		this.wss.to(room.name).emit('startingGame', room);

		// 		this.intervalId = setInterval(() => {
		// 			this.wss.to(room.name).emit('actualizeGameScreen', room);
					
		// 			// Case somebody won, removing the room.
		// 			if (this.gameService.updateGame(room))
		// 			{
		// 				this.wss.to(room.name).emit('gameEnded', room);
		// 				this.logger.log(`Game won (client id: ${client.id} (room id: ${room.name})`);
		// 				this.gameService.removeRoom(this.wss, this.intervalId, room.name);
		// 			}
		// 		}, this.gameService.FRAMERATE);
		// 	});

		// }
	}

	/**
	 * When an user disconnect, updates the database with new status. If it was a player,
	 * emits to everybody from its room to indicate that game is over and removes the room.
	 * 
	 * @param client Need to contain user db id (client.data.userDbId).
	 */
	handleDisconnect(@ConnectedSocket() client: Socket): void
	{
		this.logger.log(`Client disconnected: client id: ${client.id})`);
		this.usersService.updateGameStatus(client.data.userDbId, 'none');
		this.usersService.updateRoomId(client.data.userDbId, 'none');
		
		const room: RoomInterface = this.gameService.findRoomByPlayerId(client.id);

		if (room && room.name && room.nbPeopleConnected) {
			this.wss.to(room.name).emit('opponentLeft', { clientId: client.id, room: room });
			this.gameService.removeRoom(this.wss, this.intervalId, room.name);
		}
	}

	/**
	 * Connects the player to a room after it has chosn its game setup option, and when
	 * a room is fulfilled with two players, launches the game.
	 * Game will be proceed as following:
	 * 		- Displays a waiting screen until another player is matched.
	 * 		- Runs the game.
	 * 		- Displays end screen when a player won the game or one disconnect.
	 * 
	 * @param client Socket object with user information.
	 * @param setupChosen Setup chosen by the player.
	 */
	@SubscribeMessage('setupChosen')
	async handleSetupChosen(@ConnectedSocket() client: Socket, @MessageBody() setupChosen: SetupInterface) : Promise<void>
	{
		let room: RoomInterface = await this.gameService.attributeRoom(client.data.userDbId, client.id, setupChosen);

		if (room.nbPeopleConnected === 1)
			client.emit('waitingForPlayer');
		
		else if (room.nbPeopleConnected === 2) {
			this.wss.to(room.name).emit('startingGame', room);

			await (() => new Promise(resolve => setTimeout(resolve, this.gameService.TIME_MATCH_START)));

			this.intervalId = setInterval(() => {
				this.wss.to(room.name).emit('actualizeGameScreen', room);
				
				if (this.gameService.updateGame(client.id, this.wss, this.intervalId, room))
					this.wss.to(room.name).emit('gameEnded', room);
					
			}, this.gameService.FRAMERATE);
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
	 */
	@SubscribeMessage('disconnectClient')
	handleDisconnectClient(@ConnectedSocket() client: Socket): void
	{
		client.disconnect();
	}
};