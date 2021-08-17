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
import { RoomInterface, SetupInterface } from './interfaces/game.interface'
import { GameService } from './game.service';

/**
 * TO DO: 	- Rajouter le lien avec la base de données pour les spectateurs (notamment comment on join 
 * 			  la room, dans handle connection).
 * 			- Update les logs pour qu'on fasse la diff entre un player qui join et un spectateur.
 * 			- Gerer le emit room closed.
 * 			- Mieux gerer les cas de deconnexion et de changement de vue.
 */

/**
 * HOW IT WORKS:
 * 
 * ---------------------------------------------------------------------------------------------------------------
 * EMETTERS COTE BACK (dans leur ordre d'apparition):
 * TOUS LES EMETTEURS ENVOIENT L'OBJET 'SocketDataInterface'
 * 
 * - 'joinRoom' (1 FOIS) 
 *	>>>	Quand quelqu'un se connecte pour la premiere fois à l'onglet game. Correspond
 *		au 'waiting another player'. Le joueur 1 a donc cet ecran qui s'affiche, le joueur
 * 		2 lui recevra l'event mais ne doit pas print l'ecran. On peut checker le nombre de joueurs
 * 		dans la room dans obj.room.nbPeopleConnected
 * 
 * - 'actualizeSetupScreen' (INTERVAL)
 *	>>> Envoie l'objet toutes les x ms avec les choix actuels des options pour joueur 1 et joueur 2.
 *		Permet ainsi de faire un rendu en direct des choix actuels des joueurs. Cette evenement dure
 *		quelques secondes (defini par la constante 'TIME_GAME_SETUP' dans game.service.ts). Si joueur 1
 *		ou joueur 2 clique sur une autre option, l'objet 'SocketDataInterface' sera update par le listener
 *		'updateGameSetup'.
 *		
 * - 'displaySetupChoose' (1 FOIS)
 * 	>>> Envoie une seule fois l'objet 'SocketDataInterface' avec les options finales du jeu retenues pour
 * 		la game à venir. Si P1 et P2 n'avait pas choisi les mêmes options, la plus petite option est retenue
 * 		(ex: P1 a choisi easy, P2 a choisi medium >>> easy sera retenue).
 * 
 * - 'startingGame' (1 FOIS) (peut-etre useless cet event ?)
 * 	>>> Indique que la partie va commencer. Permet de stop de display les options choisies et d'indiquer 
 * 		le jeu va pouvoir etre display.
 * 
 * - 'actualizeGameScreen' (INTERVAL)
 * 	>>>	Envoie l'objet toutes les x ms avec les nouvelles positions de la balle et des paddle. Les positions 
 * 		des paddles peuvent etre update par le listener 'pongEvent'.
 * 
 * - 'gameEnded' (1 FOIS)
 * 	>>> Envoie l'objet avec les scores finaux. Indique que la parte est terminée, arrete l'animation du jeu
 * 		et déclenche le rendu de l'écran de victoire. Besoin que vue.js emit 'opponentLeft' apres avoir recu 
 * 		ce signal afin que tous les clients de deconnectent correctement côté back et puissent relancer une game.
 * 
 * - 'opponentLeft' (1 FOIS)
 * 	>>> Permet juste d'indiquer que 1 des 2 joueurs principaux vient de deconnecter de la partie. Entraine la
 * 		fin du jeu et la victoire par abandon de l'autre joueur (on display donc le screen de victoire). Besoin 
 * 		que vue.js emit 'opponentLeft' apres avoir recu ce signal afin que tous les clients de deconnectent 
 * 		correctement de la room côté back et puissent relancer une game.
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
 * - 'pongEvent' (@MessageBody() event: any)
 * 	>>> L'objet event contient un x et un y, permet d'update la position du joueur pendant que le jeu a lieu.
 * 
 * - 'disconnectClient' (pas de body)
 * 	>>> Survient quand un joueur dans le front change d'onglet. Cela provoque un arret du jeu, + le back emet 'opponentLeft' 
 * 		a tous les gens dans la room afin de deconnecter de la room tout le monde correctement.
 * 
 * - 'opponentLeft' (@MessageBody() room: RoomInterface)
 * 	>>> Quand le back recoit ce signal, il deconnecte le client de la room auquel il appartient.
 */

@WebSocketGateway({ cors: true, namespace: 'game' })
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect 
{
	constructor(private gameService: GameService) {};
	private logger: Logger = new Logger('GameGateway');
	private intervalId: NodeJS.Timer;
	
	@WebSocketServer() wss: Socket;

	afterInit(server: Server): void 
	{
		this.logger.log('Init done');
	}

	// The new client will join a room. If 2 players in a room, will then emit x milliseconds
	// all the game positions, and frontend will render the game using those coordinates.
	handleConnection(@ConnectedSocket() client: Socket): void
	{
		this.logger.log(`Client connected:\t\tclient id:\t${client.id}`);

		const room: RoomInterface = this.gameService.joinRoom(client.id, false);
		this.logger.log(`Room joined:\t\tclient id:\t${client.id} (room id: ${room.name})`);

		client.join(room.name);
		if (room.nbPeopleConnected === 1)
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

	// Emit to disconnect everybody in the room if one of the two players disconnect from the game
	// (including people spectating).
	handleDisconnect(@ConnectedSocket() client: Socket): void
	{
		this.logger.log(`Client disconnected:\tclient id:\t${client.id}`);
		const room: RoomInterface = this.gameService.findRoomByPlayerId(client.id);
		
		if (room && room.name)
		{
			clearInterval(this.intervalId);
			this.wss.to(room.name).emit('opponentLeft', { clientId: client.id, room: room });
			this.gameService.removeRoom(client.id);
		}
	}

	// If a player click on another option, updating his choice to all people in the room.
	@SubscribeMessage('updateGameSetup')
	handleUpdateGameSetup(@ConnectedSocket() client: Socket, @MessageBody() setup: SetupInterface) : void
	{
		const room: RoomInterface = this.gameService.updateGameSetup(client.id, setup);
		// this.wss.to(room.name).emit('gameSetupUpdated', { clientId: client.id, room });
	}

	// Update player's paddle position when a player mooves his mouse.
	@SubscribeMessage('pongEvent')
	handlePongEvent(@ConnectedSocket() client: Socket, @MessageBody() event: any): void
	{
		this.gameService.updatePlayerPos(client, event);
	}
	
	// When a player leaves the game vue, he will emit disconnectClient the server will emit 'opponentLeft'
	// event to the room making everybode leave the room. If a spectator leaves the vue, 
	// just disconnecting him from the server.
	@SubscribeMessage('disconnectClient')
	handleDisconnectClient(@ConnectedSocket() client: Socket): void
	{
		const room: RoomInterface = this.gameService.findRoomByPlayerId(client.id);
		
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