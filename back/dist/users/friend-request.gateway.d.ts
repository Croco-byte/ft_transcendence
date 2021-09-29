import { Socket, Server } from 'socket.io';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from './users.service';
export declare class FriendRequestsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly authService;
    private readonly userService;
    constructor(authService: AuthService, userService: UsersService);
    wss: Server;
    private logger;
    afterInit(server: any): void;
    handleDisconnect(client: any): void;
    handleConnection(client: Socket, args: any[]): Promise<void>;
    handleAcceptFriendRequest(client: Socket, data: {
        friendRequestId: number;
    }): Promise<void>;
    handleDeclineFriendRequest(client: Socket, data: {
        friendRequestId: number;
    }): Promise<void>;
    handleSendFriendRequest(client: Socket, data: {
        receiverId: number;
    }): Promise<void>;
    handleUnfriendUser(client: Socket, data: {
        friendId: number;
    }): Promise<void>;
    handleCancelFriendRequest(client: Socket, data: {
        receiverId: number;
    }): Promise<void>;
}
