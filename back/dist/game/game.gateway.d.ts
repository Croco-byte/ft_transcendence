import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Setup } from './interfaces/game.interface';
import { GameService } from './game.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
export declare class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly gameService;
    private readonly authService;
    private readonly usersService;
    constructor(gameService: GameService, authService: AuthService, usersService: UsersService);
    private logger;
    wss: Socket;
    afterInit(server: Server): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleSetupChosen(client: Socket, setupChosen: Setup): Promise<void>;
    handleWaitInPrivateQueue(client: Socket): Promise<void>;
    handlePrivateGame(client: Socket): Promise<void>;
    handleLaunchGame(client: Socket): Promise<void>;
    handlePongEvent(client: Socket, playerPosY: number): void;
    handleDisconnectClient(client: Socket): void;
    handlePrivateCancelled(client: Socket): void;
}
