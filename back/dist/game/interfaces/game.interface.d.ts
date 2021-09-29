/// <reference types="node" />
import { User } from "src/users/users.entity";
export interface Room {
    intervalId: NodeJS.Timer | undefined;
    name: string;
    user1DbId: number;
    user2DbId: number;
    player1Id: string;
    player2Id: string;
    game: Game;
}
export interface Game {
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
export interface Ball {
    radius: number;
    dir: number;
    x: number;
    y: number;
    speed: number;
    velX: number;
    velY: number;
}
export interface Player {
    x: number;
    y: number;
    velX: number;
    velY: number;
    setup: Setup;
}
export interface Paddle {
    height: number;
    width: number;
    border: number;
}
export interface Setup {
    level: number;
    score: number;
    paddleColor: string;
}
export interface PlayerDbInfo {
    username: string;
    displayname: string;
    avatar: string;
}
export interface EndGameInfo {
    clientId: string;
    p1DbInfo: PlayerDbInfo;
    p2DbInfo: PlayerDbInfo;
    room: Room;
}
export interface matchHistory {
    id?: number;
    winner?: User;
    looser?: User;
    winnerScore?: number;
    looserScore?: number;
    gameOptions?: string;
    looserdisconnected?: boolean;
}
