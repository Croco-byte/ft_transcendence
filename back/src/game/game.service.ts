/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { User } from '../users/users.entity';
import { InjectRepository } from '@nestjs/typeorm'
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
		@InjectRepository(User)
		private userRepository: Repository<User>,
	) {}

	private rooms: RoomInterface[] = [];
	private logger: Logger = new Logger('GameService');

	private readonly GAME_WIDTH: number = 600;
	private readonly GAME_HEIGHT: number = 400;
	private readonly BASE_SPEED: number = 6;
	private readonly BASE_VEL: number = 30;
	private readonly BALL_RADIUS: number = 15;
	private readonly PADDLE_WIDTH: number = 20;
	private readonly PADDLE_HEIGHT: number = 600 * 0.2;
	private readonly PADDLE_BORDER: number = 6;
	private readonly MAX_BALL_SPEED: number = 12;
	private readonly INCREASE_SPEED_PERCENTAGE: number = 1.05;
	private readonly MAX_ANGLE: number = Math.PI / 4;

	private readonly EASY: number = 1;
	private readonly DEFAULT_SCORE: number = 5;
	private readonly DEFAULT_PADDLE_COLOR: string = 'white';

	public readonly FRAMERATE: number = 1000 / 60;
	public readonly TIME_GAME_SETUP: number = 10000;
	public readonly TIME_DISPLAY_SETUP_CHOOSE: number = 1000;

	async joinRoom(userDbId: number, playerId: string) : Promise<RoomInterface>
	{
		const user: User = await this.userRepository.findOne(userDbId);
		let roomToFill: RoomInterface = this.rooms.find(el => el.nbPeopleConnected === 1);

		// Case spectator
		if (user.roomId != '')
		{
			roomToFill =  this.rooms.find(el => el.name === user.roomId);
			roomToFill.nbPeopleConnected++;
			this.userRepository.update(user.id, { playerStatus: 'spectating' });
			
			return roomToFill;
		}
		
		// Trying to find a room with only one player
		// else if (roomToFill && roomToFill.nbPeopleConnected == 1)
		else if (roomToFill && roomToFill.nbPeopleConnected == 1)
		{
			roomToFill.nbPeopleConnected++;
			roomToFill.player2Id = playerId;
			this.userRepository.update(user.id, { roomId: roomToFill.name, playerStatus: 'inGame' });

			return roomToFill;
		}

		// Otherwise creating a new room
		else
		{
			this.rooms.push({ 
				name: playerId, 
				player1Id: playerId, 
				player2Id: '', 
				nbPeopleConnected: 1,
				game: this.resetGame(1)
				 });
			
			this.userRepository.update(user.id, { roomId: playerId, playerStatus: 'inGame' });
			this.logger.log(`Room created (room id: ${this.rooms[this.rooms.length - 1].name})`);

			return this.rooms[this.rooms.length - 1];
		}
	}

	updateGame(userDbId: number, playerId: string, room: RoomInterface) : boolean
	{
		if (room.game.ball.x - room.game.ball.radius < 0)
		{
			room.game.p2Score++;
			room.game.ball = this.resetBall(room.game.ball.dir * -1);
		}
		else if (room.game.ball.x + room.game.ball.radius > room.game.width)
		{
			room.game.p1Score++;
			room.game.ball = this.resetBall(room.game.ball.dir * -1);
		}
		else
		{
			room.game.ball.x += room.game.ball.velX;
			room.game.ball.y += room.game.ball.velY;
			this.detectCollision(room);	
		}

		if ((room.player1Id === playerId || room.player2Id === playerId) && (
				room.game.p1Score >= room.game.p1Left.setup.score || 
				room.game.p2Score >= room.game.p1Left.setup.score))
		{
			this.updateScores(userDbId, room.game.p1Score >= room.game.p1Left.setup.score);
			return true;
		}
		
		return false;
	}

	async updateScores(userDbId: number, p1Won: boolean) : Promise<boolean>
	{
		const user: User = await this.userRepository.findOne(userDbId);

		if (p1Won)
		{
			this.userRepository.update(user.id, { wins: user.wins + 1 });
			return true;
		}

		this.userRepository.update(user.id, { wins: user.loses + 1 });
		return false;
	}

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

	private userMoveUp(room: RoomInterface, player : PlayerInterface, event: any) : void
	{
		player.y -= (player.y - event.y > player.velY) ? player.velY : player.y - event.y;
		(player.y < room.game.paddle.height / 2) ? player.y = room.game.paddle.height / 2 : 0;
	}
	
	private userMoveDown(room: RoomInterface, player : PlayerInterface, event: any) : void
	{
		player.y += (event.y - player.y > player.velY) ? player.velY : event.y - player.y;
		(player.y > this.GAME_HEIGHT - room.game.paddle.height / 2) ? 
				player.y = this.GAME_HEIGHT - room.game.paddle.height / 2 : 0;
	}

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

	private resetSetup() : SetupInterface
	{
		return {
			level: this.EASY,
			score: this.DEFAULT_SCORE,
			paddleColor: this.DEFAULT_PADDLE_COLOR,
		}
	}

	private resetPaddle() : PaddleInterface
	{
		return {
			width: this.PADDLE_WIDTH,
			height: this.PADDLE_HEIGHT,
			border: this.PADDLE_BORDER,
		}
	}

	updateGameSetup(playerId: string, playerSetup: SetupInterface) : void
	{
		const room: RoomInterface = this.findRoomByPlayerId(playerId);

		if (room && playerId === room.player1Id)
			room.game.p1Left.setup = playerSetup;
		else if (room && playerId === room.player2Id)
			room.game.p2Right.setup = playerSetup;
	}
	
	chooseGameSetup(playerId: string) : void
	{
		const room: RoomInterface = this.findRoomByPlayerId(playerId);

		if (room && room.player1Id === playerId)
		{
			const setup1: SetupInterface = room.game.p1Left.setup;
			const setup2: SetupInterface = room.game.p2Right.setup;

			// Choosing the lowest level between the two player choices.
			if (setup1.level < setup2.level)
				setup2.level = setup1.level;
			else
				setup1.level = setup2.level;
			
			// Same thing for score.
			if (setup1.score < setup2.score)
				setup2.score = setup1.score;
			else
				setup1.score = setup2.score;
		}
	}

	findRoomByPlayerId(playerId: string) : RoomInterface
	{
		return this.rooms.find(el => el.player1Id === playerId || el.player2Id === playerId);
	}

	removeRoom(wss: Socket, intervalId: NodeJS.Timer, playerId: string, roomName: string) : void
	{
		clearInterval(intervalId);
		wss.in(roomName).socketsLeave(roomName);
		
		this.logger.log(`Room closed (room id: ${roomName})`);
		this.logger.log(`Room has been left (player id: ${playerId}, room id: ${roomName})`);
		this.rooms = this.rooms.filter((el) => el.name != roomName);
	}

	async updatePlayerStatus(userDbId: number) : Promise<void>
	{
		this.userRepository.update(userDbId, { roomId: 'none', playerStatus: 'none' });
	}
}
