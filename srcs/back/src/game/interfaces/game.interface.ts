import { User } from "src/users/users.entity";

/* eslint-disable prettier/prettier */
export interface Room
{
	intervalId: NodeJS.Timer | undefined;
	name: string;
	user1DbId: number;
	user2DbId: number;
	player1Id: string;
	player2Id: string;
	game: Game;
}

export interface Game
{
	isStarted: boolean;
	width: number;
	height: number;
	p1Score: number;
	p2Score: number;
	ball: Ball;
	paddle: Paddle;
	p1Left: Player;
	p2Right: Player;
}

export interface Ball 
{
	radius: number;
	dir: number;
	x: number;
	y: number;
	speed: number;
	velX: number;
	velY: number
}

export interface Player 
{
	x: number;
	y: number;
	velX: number;
	velY: number;
	setup: Setup;
}

export interface Paddle 
{
	height: number;
	width: number;
	border: number;
}

export interface Setup
{
	// 1, 2 or 3
	level: number;

	// 5, 10 or 15
	score: number;

	// 5 colors ?
	paddleColor: string;
}

export interface PlayerDbInfo
{
	username: string;
	displayname: string;
	avatar: string;
}

export interface EndGameInfo
{
	clientId: string;
	p1DbInfo: PlayerDbInfo;
	p2DbInfo: PlayerDbInfo;
	room: Room;
}

export interface matchHistory
{
	id?: number;
	winner?: User;
	looser?: User;
	winnerScore?: number;
	looserScore?: number;
	gameOptions?: string;
	looserdisconnected?: boolean;
}
