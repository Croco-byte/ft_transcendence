export interface Room
{
	name: string;
	player1Id: string;
	player2Id: string;
	nbPlayer: number;
	game: Game;
}

export interface Game
{
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

	// 5 colors
	paddleColor: string;
}

export interface PlayerDbInfo
{
	username: string;
	avatar: string;
}

export interface EndGameInfo
{
	disconnected: string;
	p1DbInfo: PlayerDbInfo;
	p2DbInfo: PlayerDbInfo;
	room: Room;
}