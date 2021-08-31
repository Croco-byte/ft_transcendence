/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { User } from '../users/users.entity';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config'
import {
  SetupInterface,
  PlayerInterface,
  BallInterface,
  RoomInterface,
  PaddleInterface,
  GameInterface,
} from './interfaces/game.interface';

@Injectable()
export class GameService
{
	constructor(
		private usersService: UsersService,
		private configService: ConfigService,
	) {}

	private rooms: RoomInterface[] = [];
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

	private readonly DEFAULT_LEVEL: number = this.configService.get<number>('default_level');
	private readonly DEFAULT_SCORE: number = this.configService.get<number>('default_score');
	private readonly DEFAULT_PADDLE_COLOR: string = this.configService.get<string>('default_paddle_color');

	public readonly FRAMERATE: number = 1000 / this.configService.get<number>('framerate');
	public readonly TIME_GAME_SETUP: number = this.configService.get<number>('time_game_setup');
	public readonly TIME_DISPLAY_SETUP_CHOOSE: number = 
			this.configService.get<number>('time_display_setup_choose');;


	/**
	 * Finds which room the player belongs.
	 * 
	 * @param playerId Client socket ID.
	 * @return A room object containing playerId. Null otherwise.
	 */
	findRoomByPlayerId(playerId: string) : RoomInterface
	{
		return this.rooms.find(el => el.player1Id === playerId || el.player2Id === playerId);
	}

	/**
	 * Attributes a room to a player or a spectator.
	 * 
	 * @param userDbId The Id of an user in User's table.
	 * @param playerId Client socket ID.
	 * @return A RoomInterface object with all the game information.
	 */
	async joinRoom(userDbId: number, playerId: string) : Promise<RoomInterface>
	{
		const user: User = await this.usersService.findUserById(userDbId);

		// Case spectator
		if (user.roomId != 'none' && user.gameStatus === 'spectating') {
			const roomToSpectate = this.rooms.find(el => el.name === user.roomId);
			roomToSpectate.nbPeopleConnected++;
			
			return roomToSpectate;
		}
		
		this.usersService.updateGameStatus(userDbId, 'inGame');
		const roomToFill: RoomInterface = this.rooms.find(el => el.nbPeopleConnected === 1);

		if (roomToFill && roomToFill.nbPeopleConnected == 1) {
			roomToFill.nbPeopleConnected++;
			roomToFill.user2DbId = userDbId;
			roomToFill.player2Id = playerId;
			this.usersService.updateRoomId(userDbId, roomToFill.name);

			return roomToFill;
		}

		// Creating new room if nobody is waiting for another player.
		else {
			this.rooms.push({ 
				name: playerId, 
				user1DbId: userDbId,
				user2DbId: 0,
				player1Id: playerId, 
				player2Id: '', 
				nbPeopleConnected: 1,
				game: this.resetGame(1)
				 });

			this.usersService.updateRoomId(userDbId, playerId);
			this.logger.log(`Room created (room id: ${this.rooms[this.rooms.length - 1].name})`);

			return this.rooms[this.rooms.length - 1];
        }
	}

	/**
	 * Makes every connected socket leaves a specific room in order to close it.
	 * 
	 * @param wss A websocket object.
	 * @param intervalId Clear the interval if existing.
	 * @param playerId Client socket ID.
	 * @param roomName Room name where playerId belongs.
	 */
	removeRoom(wss: Socket, intervalId: NodeJS.Timer, roomName: string) : void
	{
		clearInterval(intervalId);
		wss.in(roomName).socketsLeave(roomName);
		
		this.logger.log(`Room closed (room id: ${roomName})`);
		this.rooms = this.rooms.filter((el) => el.name != roomName);
	}

	/**
	 * Updates setup options for one player.
	 * 
	 * @param playerId Client socket ID. If it's a spectator ID, function does nothing.
	 * @param playerSetup Will be the new setup choose for this player.
	 */
	updateGameSetup(playerId: string, playerSetup: SetupInterface) : void
	{
		const room: RoomInterface = this.findRoomByPlayerId(playerId);

		if (room && playerId === room.player1Id)
			room.game.p1Left.setup = playerSetup;
		else if (room && playerId === room.player2Id)
			room.game.p2Right.setup = playerSetup;
	}
	
	/**
	 * Sets setup options for player 1 and player 2 after they choose. If they didn't
	 * choose item for 'level' and 'score', the lowest choice will be chosen (ex: P1 choose
	 * 'easy, P2 'medium', the level difficulty will be set to 'easy').
	 * 
	 * @param room Object with game information, will be updated with new setups.
	 */
	chooseGameSetup(room: RoomInterface) : void
	{
		const setup1: SetupInterface = room.game.p1Left.setup;
		const setup2: SetupInterface = room.game.p2Right.setup;

		if (setup1.level < setup2.level)
			setup2.level = setup1.level;
		else
			setup1.level = setup2.level;
		
		if (setup1.level === this.MEDIUM) {
			this.PADDLE_HEIGHT = this.configService.get<number>('paddle_height_screen_percentage_medium');
			this.INCREASE_SPEED_PERCENTAGE = this.configService.get<number>('increase_speed_percentage_medium');
		}
		else if (setup1.level === this.HARD) {
			this.PADDLE_HEIGHT = this.configService.get<number>('paddle_height_screen_percentage_hard');
			this.INCREASE_SPEED_PERCENTAGE = this.configService.get<number>('increase_speed_percentage_hard');
		}

		if (setup1.score < setup2.score)
			setup2.score = setup1.score;
		else
			setup1.score = setup2.score;
	}


	/**
	 * Handles the whole game (player scoring, ball hit by a player...).
	 * 
	 * @param room Object with game information. Will be updated with new ball / players position.
	 */
	updateGame(room: RoomInterface) : boolean
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
				room.game.p2Score >= room.game.p1Left.setup.score)
			return this.updateScores(room);
		
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
	updateScores(room: RoomInterface): boolean
	{
		room.game.p1Score >= room.game.p1Left.setup.score ? this.usersService.incUserWins(room.user1DbId) :
				this.usersService.incUserLoses(room.user1DbId);
		
		room.game.p2Score >= room.game.p1Left.setup.score ? this.usersService.incUserWins(room.user2DbId) :
				this.usersService.incUserLoses(room.user2DbId);

		return true;
	}

	/**
	 * Detects if the ball meet a wall / a paddle, and calculates new ball direction if
	 * it's the case.
	 * 
	 * @param room Object with game information, will be updated with new ball direction.
	 */
	private detectCollision(room: RoomInterface) : void
	{
		const ball: BallInterface = room.game.ball;
		const p1Left: PlayerInterface = room.game.p1Left;
		const p2Right: PlayerInterface = room.game.p2Right;
		const paddle: PaddleInterface = room.game.paddle;

		if (ball.x - ball.radius > p2Right.x - paddle.width - paddle.border 
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
	private playerOneIntersectBall(room: RoomInterface) : void
	{
		const percentIntersect: number = (room.game.ball.y - room.game.p1Left.y)/ (room.game.paddle.height / 2);
		const angleRad: number = percentIntersect < 0 ? -percentIntersect * this.MAX_ANGLE : 
				percentIntersect * this.MAX_ANGLE;
				
		room.game.ball.velX = room.game.ball.speed * Math.cos(angleRad);
		room.game.ball.velY = percentIntersect < 0 ? room.game.ball.speed * -Math.sin(angleRad) :
				room.game.ball.speed * Math.sin(angleRad)

		if (room.game.ball.speed < this.MAX_BALL_SPEED)
			room.game.ball.speed *= this.INCREASE_SPEED_PERCENTAGE;
	}
	
	/**
	 * Calculates the new ball's direction when player two hits the ball. Increase
	 * ball' speed aswell.
	 * 
	 * @param room Object with game information, will be updated with new ball direction.
	 */
	private playerTwoIntersectBall(room: RoomInterface) : void
	{
		const percentIntersect: number = (room.game.ball.y - room.game.p2Right.y) / (room.game.paddle.height / 2);
		const angleRad: number = percentIntersect < 0 ? -percentIntersect * this.MAX_ANGLE : 
				percentIntersect * this.MAX_ANGLE;

		room.game.ball.velX = room.game.ball.speed * -Math.cos(angleRad);
		room.game.ball.velY = percentIntersect < 0 ? room.game.ball.speed * -Math.sin(angleRad) :
				room.game.ball.speed * Math.sin(angleRad);

		if (room.game.ball.speed < this.MAX_BALL_SPEED)
			room.game.ball.speed *= this.INCREASE_SPEED_PERCENTAGE;
	}

	/**
	 * Updates player's paddle position accordingly to mouse Y position.
	 * 
	 * @param playerId Client socket ID. If it's a spectator ID, function does nothing.
	 * @param playerPosY Y position of player's mouse.
	 */
	updatePlayerPos(playerId: string, playerPosY: number) : void
	{
		const room: RoomInterface = this.rooms.find(el => el.player1Id === playerId || 
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
	private userMoveUp(room: RoomInterface, player : PlayerInterface, event: any) : void
	{
		player.y -= (player.y - event.y > player.velY) ? player.velY : player.y - event.y;
		(player.y < room.game.paddle.height / 2) ? player.y = room.game.paddle.height / 2 : 0;
	}
	
	/**
	 * Updates player's paddle position if it moove down its mouse.
	 * 
	 * @param room Object with game information.
	 * @param player Object with player information. Will be updated with new player position.
	 * @param event Player mouse's coordinates.
	 */
	private userMoveDown(room: RoomInterface, player : PlayerInterface, event: any) : void
	{
		player.y += (event.y - player.y > player.velY) ? player.velY : event.y - player.y;
		(player.y > this.GAME_HEIGHT - room.game.paddle.height / 2) ? 
				player.y = this.GAME_HEIGHT - room.game.paddle.height / 2 : 0;
	}

	/**
	 * @param dir Initial ball direction (should be 1 or -1).
	 * @param _p1score Initial score of player 1.
	 * @param _p2score Initial score of player 2.
	 * @return A Game object with default configuration.
	 */
	resetGame(dir: number, _p1score = 0, _p2score = 0) : GameInterface
	{
		return {
			width: this.GAME_WIDTH,
			height: this.GAME_HEIGHT,
			p1Score: _p1score,
			p2Score: _p2score,
			ball: this.resetBall(dir),
			paddle: this.resetPaddle(),
			p1Left: this.resetPlayer(true),
			p2Right: this.resetPlayer(false),
		};
	}

	/**
	 * @return A Ball object with default configuration.
	 */
	private resetBall(dir: number) : BallInterface
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
	 * @return A Player object with default configuration.
	 */
	private resetPlayer(left: boolean) : PlayerInterface
	{
		if (left)
			return {
				x: this.PADDLE_BORDER,
				y: this.GAME_HEIGHT * 0.5,
				velX: this.BASE_VEL,
				velY: this.BASE_VEL,
				setup: this.resetSetup(),
			}
		else
			return {
				x: this.GAME_WIDTH - this.PADDLE_BORDER - this.PADDLE_WIDTH,
				y: this.GAME_HEIGHT * 0.5,
				velX: this.BASE_VEL,
				velY: this.BASE_VEL,
				setup: this.resetSetup(),
			}
	}

	/**
	 * @return A Setup object with default configuration.
	 */
	private resetSetup() : SetupInterface
	{
		return {
			level: this.DEFAULT_LEVEL,
			score: this.DEFAULT_SCORE,
			paddleColor: this.DEFAULT_PADDLE_COLOR,
		}
	}

	/**
	 * @return A Paddle object with default configuration.
	 */
	private resetPaddle() : PaddleInterface
	{
		return {
			width: this.PADDLE_WIDTH,
			height: this.PADDLE_HEIGHT,
			border: this.PADDLE_BORDER,
		}
	}
}
