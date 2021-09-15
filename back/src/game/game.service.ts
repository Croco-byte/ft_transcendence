/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config'
import {
  Setup,
  Player,
  Ball,
  Room,
  Paddle,
  Game,
  EndGameInfo,
  PlayerDbInfo,
  matchHistory,
} from './interfaces/game.interface';
import { MatchHistoryEntity } from '../users/match-history.entity';
import { getConnection, Repository } from 'typeorm';

@Injectable()
export class GameService
{
	constructor(
		@InjectRepository(MatchHistoryEntity)
		private matchHistoryRepository: Repository<MatchHistoryEntity>,
//		@InjectRepository(MatchHistoryEntity)
//		private userRepository: Repository<User>,
		private usersService: UsersService,
		private configService: ConfigService,
	) {}

	private rooms: Room[] = [];
	private logger: Logger = new Logger('GameService');

	private readonly EASY: number = 1;
	private readonly MEDIUM: number = 2;
	private readonly HARD: number = 3;

	private readonly GAME_WIDTH: number = this.configService.get<number>('game_width');
	private readonly GAME_HEIGHT: number = this.configService.get<number>('game_height');
	private readonly BASE_SPEED: number = this.configService.get<number>('base_speed');
	private readonly BASE_VEL: number = this.configService.get<number>('base_vel');
	private readonly BALL_RADIUS: number = this.configService.get<number>('ball_radius');
	private PADDLE_HEIGHT: number = 
			this.configService.get<number>('paddle_height_screen_percentage_easy') * this.GAME_HEIGHT;
	private readonly PADDLE_WIDTH: number = 
			this.configService.get<number>('paddle_width_screen_percentage') * this.GAME_WIDTH;
	private readonly PADDLE_BORDER: number = 
			this.configService.get<number>('paddle_border_width_screen_percentage') * this.GAME_WIDTH;
	private readonly MAX_BALL_SPEED: number = this.configService.get<number>('max_ball_speed');
	private INCREASE_SPEED_PERCENTAGE: number = 
			this.configService.get<number>('increase_speed_percentage_easy');
	private readonly MAX_ANGLE: number = Math.PI / 4;

	public readonly FRAMERATE: number = 1000 / this.configService.get<number>('framerate');
	public readonly TIME_MATCH_START: number = this.configService.get<number>('time_match_start');

	/**
	 * Finds which room the player belongs.
	 * 
	 * @param playerId Client socket ID.
	 * @return A room object containing playerId. Null otherwise.
	 */
	findRoomByPlayerId(playerId: string) : Room
	{
		return this.rooms.find(el => el.player1Id === playerId || el.player2Id === playerId);
	}

	/**
	 * Attributes a room to a player or a spectator.
	 * 
	 * @param userDbId The Id of an user in User's table.
	 * @param playerId Client socket ID.
	 * @param setupChosen Setup chosen by player.
	 * @return A Room object with all the game information.
	 */
	async attributeRoom(userDbId: number, playerId: string, setupChosen?: Setup) : Promise<Room>
	{
		const user: User = await this.usersService.findUserById(userDbId);

		if (user.roomId != 'none' && user.status === 'spectating') {
			const roomToSpectate = this.rooms.find(el => el.name === user.roomId);
			roomToSpectate.nbPeopleConnected++;
			
			return roomToSpectate;
		}
		
		const roomToFill: Room = this.rooms.find(el => el.nbPeopleConnected === 1 && 
				this.checkIfSameSetup(el.game.p1Left.setup, setupChosen));

		if (roomToFill) 
			return this.playerJoinRoom(roomToFill, setupChosen, userDbId, playerId);
		else
			return this.createNewRoom(setupChosen, userDbId, playerId);
	}

	/**
	 * Updates a room with only player 1 information, with player 2 informations.
	 * Updates gameStatus to 'inGame' and roomId in database for both players.
	 * 
	 * @param roomToFill A Room object with information for only one player.
	 * @param setupChosen Setup chosen by player.
	 * @param userDbId Player 2 database id.
	 * @param playerId Player 2 socket id.
	 * @return A Room object with all the game information, so the game can be started.
	 */
	playerJoinRoom(roomToFill: Room, setupChosen: Setup, userDbId: number, playerId: string) : Room
	{
		roomToFill.nbPeopleConnected++;
		roomToFill.user2DbId = userDbId;
		roomToFill.player2Id = playerId;
		roomToFill.game.p2Right.setup = setupChosen;
		
		this.usersService.updateRoomId(roomToFill.user1DbId, roomToFill.name);
		this.usersService.updateRoomId(roomToFill.user2DbId, playerId);
		return roomToFill;
	}

	/**
	 * Creates a new room with information of player 1. Needs information of player 2 to start
	 * a new game.
	 * 
	 * @param setupChosen Setup chosen by player one.
	 * @param userDbId Player 1 database id.
	 * @param playerId Player 1 socket id.
	 */
	createNewRoom(setupChosen: Setup, userDbId: number, playerId: string) : Room
	{
		this.rooms.push({ 
			name: playerId, 
			user1DbId: userDbId,
			user2DbId: 0,
			player1Id: playerId, 
			player2Id: '', 
			nbPeopleConnected: 1,
			game: this.resetGame(setupChosen)
		});

		this.logger.log(`Room created (room id: ${this.rooms[this.rooms.length - 1].name})`);

		return this.rooms[this.rooms.length - 1];
	}

	/**
	 * Makes every connected socket leaves a specific room in order to close it.
	 * 
	 * @param wss A websocket object.
	 * @param intervalId Clear the interval if existing.
	 * @param room Room object with all the game information.
	 * @param clientId If fulfilled, will trigger opponentLeft event emit. If not gameEnded event
	 * 			will be emit.
	 */
	async removeRoom(wss: Socket, intervalId: NodeJS.Timer, room: Room, clientId?: string) : Promise<void>
	{
		const endGameInfo: EndGameInfo = await this.resetEndGameInfo(room, clientId);

		!endGameInfo.clientId ? wss.to(room.name).emit('gameEnded', endGameInfo) : 
				wss.to(room.name).emit('opponentLeft', endGameInfo);

		wss.in(room.name).socketsLeave(room.name);
		
		this.logger.log(`Room closed (room id: ${room.name})`);
		this.rooms = this.rooms.filter((el) => el.name != room.name);
	}

	/**
	 * Compares two setup.
	 * 
	 * @param setup1 First setup to compare.
	 * @param setup2 Second setup to compare.
	 * @return True if same level and same score. False otherwise.
	 */
	checkIfSameSetup(setup1: Setup, setup2: Setup) : boolean
	{
		if (setup1.level === setup2.level
				&& setup1.score === setup2.score)
			return true;
		return false;
	}

	/**
	 * Handles the whole game (player scoring, ball hit by a player, game ended...).
	 * 
	 * @param wss A websocket object.
	 * @param intervalId Clear the interval if existing.
	 * @param room Object with game information. Will be updated with new ball / players position.
	 */
	updateGame(wss: Socket, intervalId: NodeJS.Timer, room: Room) : boolean
	{
		if ((room.game.ball.x - room.game.ball.radius) < 0) {
			room.game.p2Score++;
			room.game.ball = this.resetBall(room.game.ball.dir * -1);
		}

		else if ((room.game.ball.x + room.game.ball.radius) > room.game.width) {
			room.game.p1Score++;
			room.game.ball = this.resetBall(room.game.ball.dir * -1);
		}

		else {
			room.game.ball.x += room.game.ball.velX;
			room.game.ball.y += room.game.ball.velY;
			this.detectCollision(room);
		}

		if (room.game.p1Score >= room.game.p1Left.setup.score || 
			room.game.p2Score >= room.game.p1Left.setup.score) {
				clearInterval(intervalId);
				this.addToMatchHistory(room);
				this.updateScores(room);
				this.removeRoom(wss, intervalId, room);
				return true;
		}
		
		return false;
	}

	/**
	 * Increments by one the number of wins / loses for a player depending on the result
	 * of the game.
	 * 
	 * @param room Object with game information.
	 * @param playerId Client socket ID.
	 * @param userDbId Database ID retrieved after authentification.
	 */
	async updateScores(room: Room): Promise<boolean>
	{
		if (room.game.p1Score >= room.game.p1Left.setup.score)
		{
			await getConnection()
					.createQueryBuilder()
					.update(User)
					.set({ wins: () => "wins + 1", score: () => "score + 50" })
					.where("id = :id", { id: room.user1DbId })
					.execute();

			await getConnection()
					.createQueryBuilder()
					.update(User)
					.set({ loses: () => "loses + 1", score: () => "score - 30" })
					.where("id = :id", { id: room.user2DbId })
					.execute();
		} else
		{
			await getConnection()
					.createQueryBuilder()
					.update(User)
					.set({ wins: () => "wins + 1", score: () => "score + 50" })
					.where("id = :id", { id: room.user2DbId })
					.execute();

			await getConnection()
					.createQueryBuilder()
					.update(User)
					.set({ loses: () => "loses + 1", score: () => "score - 30" })
					.where("id = :id", { id: room.user1DbId })
					.execute();
		}
		return true;
	}

	async addToMatchHistory(room: Room): Promise<void>
	{
		if (room.game.p1Score >= room.game.p1Left.setup.score)
		{
			const winner: User = await this.usersService.findUserById(room.user1DbId);
			const looser: User = await this.usersService.findUserById(room.user2DbId);
			const winnerScore = room.game.p1Score;
			const looserScore = room.game.p2Score;
			const gameOptions = '{ "level": ' + room.game.p1Left.setup.level +', "score": ' + room.game.p1Left.setup.score + ' }';
			const record: matchHistory= {
				winner,
				looser,
				winnerScore,
				looserScore,
				gameOptions
			}

			this.matchHistoryRepository.save(record);
		}
		else
		{
			const winner: User = await this.usersService.findUserById(room.user2DbId);
			const looser: User = await this.usersService.findUserById(room.user1DbId);
			const winnerScore = room.game.p2Score;
			const looserScore = room.game.p1Score;
			const gameOptions = '{ "level": ' + room.game.p1Left.setup.level +', "score": ' + room.game.p1Left.setup.score + ' }';
			const record: matchHistory= {
				winner,
				looser,
				winnerScore,
				looserScore,
				gameOptions
			}
			this.matchHistoryRepository.save(record);
		}
	}

	/**
	 * Detects if the ball meet a wall / a paddle, and calculates new ball direction if
	 * it's the case.
	 * 
	 * @param room Object with game information, will be updated with new ball direction.
	 */
	private detectCollision(room: Room) : void
	{
		const ball: Ball = room.game.ball;
		const p1Left: Player = room.game.p1Left;
		const p2Right: Player = room.game.p2Right;
		const paddle: Paddle = room.game.paddle;

		if (ball.x + ball.radius > room.game.width - paddle.width - paddle.border 
				&& ball.y + ball.radius > p2Right.y - paddle.height / 2 
				&& ball.y - ball.radius < p2Right.y + paddle.height / 2)
			this.playerTwoIntersectBall(room);
			
		else if (ball.x - ball.radius < paddle.border + paddle.width 
				&& ball.y > p1Left.y - paddle.height / 2 && ball.y < p1Left.y + paddle.height / 2)
			this.playerOneIntersectBall(room);

		// Case collision to wall up and down.
		else if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= room.game.height)
			room.game.ball.velY = room.game.ball.velY * -1;
	}

	/**
	 * Calculates the new ball's direction when player one hits the ball. Increases
	 * ball' speed aswell.
	 * 
	 * @param room Object with game information, will be updated with new ball direction.
	 */
	private playerOneIntersectBall(room: Room) : void
	{
		const ball: Ball = room.game.ball;
		const paddle: Paddle = room.game.paddle;
		const percentIntersect: number = (ball.y - room.game.p1Left.y) / (paddle.height / 2);
		const angleRad: number = percentIntersect < 0 ? -percentIntersect * this.MAX_ANGLE : 
				percentIntersect * this.MAX_ANGLE;
				
		ball.velX = ball.speed * Math.cos(angleRad);
		ball.velY = percentIntersect < 0 ? ball.speed * -Math.sin(angleRad) :
				ball.speed * Math.sin(angleRad)

		if (ball.x - ball.radius < paddle.border + paddle.width)
			ball.x = paddle.border + paddle.width + ball.radius;
		if (ball.speed < this.MAX_BALL_SPEED)
			ball.speed *= this.INCREASE_SPEED_PERCENTAGE;
	}
	
	/**
	 * Calculates the new ball's direction when player two hits the ball. Increase
	 * ball' speed aswell.
	 * 
	 * @param room Object with game information, will be updated with new ball direction.
	 */
	private playerTwoIntersectBall(room: Room) : void
	{
		const ball: Ball = room.game.ball;
		const paddle: Paddle = room.game.paddle;
		const percentIntersect: number = (ball.y - room.game.p2Right.y) / (paddle.height / 2);
		const angleRad: number = percentIntersect < 0 ? -percentIntersect * this.MAX_ANGLE : 
				percentIntersect * this.MAX_ANGLE;

		ball.velX = ball.speed * -Math.cos(angleRad);
		ball.velY = percentIntersect < 0 ? ball.speed * -Math.sin(angleRad) :
				ball.speed * Math.sin(angleRad);

		if (ball.x + ball.radius > room.game.width - paddle.border - paddle.width)
			ball.x = room.game.width - paddle.border - paddle.width - ball.radius;
		if (ball.speed < this.MAX_BALL_SPEED)
			ball.speed *= this.INCREASE_SPEED_PERCENTAGE;
	}

	/**
	 * Updates player's paddle position accordingly to mouse Y position.
	 * 
	 * @param playerId Client socket ID. If it's a spectator ID, function does nothing.
	 * @param playerPosY Y position of player's mouse.
	 */
	updatePlayerPos(playerId: string, playerPosY: number) : void
	{
		const room: Room = this.rooms.find(el => el.player1Id === playerId || 
				el.player2Id === playerId);
		
		if (room && room.player1Id === playerId)
			playerPosY > room.game.p1Left.y ? this.userMoveDown(room, room.game.p1Left, playerPosY) :
					this.userMoveUp(room, room.game.p1Left, playerPosY);

		else if (room)
			playerPosY > room.game.p2Right.y ? this.userMoveDown(room, room.game.p2Right, playerPosY) :
					this.userMoveUp(room, room.game.p2Right, playerPosY);
	}

	/**
	 * Updates player's paddle position if it moove up its mouse.
	 * 
	 * @param room Object with game information.
	 * @param player Object with player information. Will be updated with new player position.
	 * @param event Player mouse's coordinates.
	 */
	private userMoveUp(room: Room, player : Player, playerPosY: number) : void
	{
		player.y -= (player.y - playerPosY > player.velY) ? player.velY : player.y - playerPosY;
		(player.y < room.game.paddle.height / 2) ? player.y = room.game.paddle.height / 2 : 0;
	}
	
	/**
	 * Updates player's paddle position if it moove down its mouse.
	 * 
	 * @param room Object with game information.
	 * @param player Object with player information. Will be updated with new player position.
	 * @param event Player mouse's coordinates.
	 */
	private userMoveDown(room: Room, player : Player, playerPosY: number) : void
	{
		player.y += (playerPosY - player.y > player.velY) ? player.velY : playerPosY - player.y;
		(player.y > this.GAME_HEIGHT - room.game.paddle.height / 2) ? 
				player.y = this.GAME_HEIGHT - room.game.paddle.height / 2 : 0;
	}

	/**
	 * Sets the game parameter (paddle height and increase ball speed) to the difficulty level 
	 * chosen.
	 * 
	 * @param level The game difficulty level.
	 */
	setOptions(level: string)
	{
		this.PADDLE_HEIGHT = this.configService.get<number>('paddle_height_screen_percentage_' + level)
				* this.GAME_HEIGHT;
		this.INCREASE_SPEED_PERCENTAGE = 
				this.configService.get<number>('increase_speed_percentage_' + level);
	}

	/**
	 * @param _room  Object with game information.
	 * @param _clientId Socket client Id case it disconnects from the game.
	 */
	private async resetEndGameInfo(_room: Room, _clientId?: string) : Promise<EndGameInfo>
	{
		return {
			clientId: _clientId,
			p1DbInfo: await this.resetPlayerDbInfo(_room.user1DbId),
			p2DbInfo: await this.resetPlayerDbInfo(_room.user2DbId),
			room: _room,
		}
	}

	/**
	 * @param userDbId  The Id of an user in User's table.
	 */
	private async resetPlayerDbInfo(userDbId: number) : Promise<PlayerDbInfo>
	{
		try {
			const user = await this.usersService.findUserById(userDbId);
			return {
				username: user.username,
				avatar: user.avatar,
			}
		}
		catch {
			this.logger.log('Could\'t find user required in order to update room ID');	
		}
	}

	/**
	 * @param setupChosen Setup chosen by player one.
	 * @param dir Initial ball direction (should be 1 or -1).
	 * @param _p1score Initial score of player 1.
	 * @param _p2score Initial score of player 2.
	 * @return A Game object with default configuration.
	 */
	resetGame(setup: Setup, dir = 1, _p1score = 0, _p2score = 0) : Game
	{
		if (setup.level === this.MEDIUM)
			this.setOptions('medium');
		else if (setup.level === this.HARD)
			this.setOptions('hard');

		return {
			width: this.GAME_WIDTH,
			height: this.GAME_HEIGHT,
			p1Score: _p1score,
			p2Score: _p2score,
			ball: this.resetBall(dir),
			paddle: this.resetPaddle(),
			p1Left: this.resetPlayer(setup, true),
			p2Right: this.resetPlayer(setup, false),
		};
	}

	/**
	 * @return A Ball object with default configuration.
	 */
	private resetBall(dir: number) : Ball
	{
		return {
			radius: this.BALL_RADIUS,
			dir: dir,
			x: this.GAME_WIDTH * 0.5,
			y: this.GAME_HEIGHT * 0.5,
			speed: this.BASE_SPEED,
			velX: dir * this.BASE_SPEED,
			velY: 0,
		}
	}

	/**
	 * @param setupChosen Setup chosen by player one.
	 * @return A Player object with default configuration.
	 */
	private resetPlayer(setupChosen: Setup, left: boolean) : Player
	{
		if (left)
			return {
				x: this.PADDLE_BORDER,
				y: this.GAME_HEIGHT * 0.5,
				velX: this.BASE_VEL,
				velY: this.BASE_VEL,
				setup: this.resetSetup(setupChosen),
			}
		else
			return {
				x: this.GAME_WIDTH - this.PADDLE_BORDER - this.PADDLE_WIDTH,
				y: this.GAME_HEIGHT * 0.5,
				velX: this.BASE_VEL,
				velY: this.BASE_VEL,
				setup: this.resetSetup(setupChosen),
			}
	}

	/**
	 * @param setupChosen Setup chosen by player one.
	 * @return A Setup object with default configuration.
	 */
	private resetSetup(setupChosen: Setup) : Setup
	{
		this.logger.log(`level = ${setupChosen.level} score = ${setupChosen.score}`)

		return {
			level: setupChosen.level,
			score: setupChosen.score,
			paddleColor: setupChosen.paddleColor,
		}
	}

	/**
	 * @return A Paddle object with default configuration.
	 */
	private resetPaddle() : Paddle
	{
		return {
			width: this.PADDLE_WIDTH,
			height: this.PADDLE_HEIGHT,
			border: this.PADDLE_BORDER,
		}
	}
}
