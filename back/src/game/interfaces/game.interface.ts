/* eslint-disable prettier/prettier */
export interface SocketDataInterface
{
	clientId: string;
	room: RoomInterface;
}

export interface RoomInterface
{
	name: string;
	user1DbId: number;
	user2DbId: number;
	player1Id: string;
	player2Id: string;
	nbPeopleConnected: number;
	game: GameInterface;
}

export interface GameInterface
{
	width: number;
	height: number;
	p1Score: number;
	p2Score: number;
	ball: BallInterface;
	paddle: PaddleInterface;
	p1Left: PlayerInterface;
	p2Right: PlayerInterface;
}

export interface BallInterface 
{
	radius: number;
	dir: number;
	x: number;
	y: number;
	speed: number;
	velX: number;
	velY: number
}

export interface PlayerInterface 
{
	x: number;
	y: number;
	velX: number;
	velY: number;
	setup: SetupInterface;
}

export interface PaddleInterface 
{
	height: number;
	width: number;
	border: number;
}

export interface SetupInterface
{
	// 1, 2 or 3
	level: number;

	// 5, 10 or 15
	score: number;

	// 5 colors ?
	paddleColor: string;
}
