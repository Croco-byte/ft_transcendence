export interface SocketDataInterface
{
	clientId: string;
	room: RoomInterface;
}

export interface RoomInterface
{
	name: string;
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
	level: number;
	score: number;
	paddleColor: string;
}
