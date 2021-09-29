import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from './users.service';
export declare class StatusGateway implements OnModuleDestroy, OnModuleInit, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly authService;
    private readonly userService;
    constructor(authService: AuthService, userService: UsersService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    wss: Server;
    private logger;
    afterInit(server: any): void;
    handleDisconnect(client: any): Promise<void>;
    handleConnection(client: Socket, args: any[]): Promise<void>;
    handleOnline(client: Socket, data: any): Promise<void>;
    handleOffline(client: Socket, data: any): Promise<void>;
    handleInGame(client: Socket, data: any): Promise<void>;
    handleInQueue(client: Socket, data: any): Promise<void>;
    handleSpectating(client: Socket, dbIds: any): Promise<void>;
    handleChallengeSomebody(client: Socket, obj: any): Promise<void>;
    handleDeclinedChallenge(client: Socket, userId: number): Promise<void>;
    verifyAccountUnicity(client: Socket, data: any): Promise<void>;
}
