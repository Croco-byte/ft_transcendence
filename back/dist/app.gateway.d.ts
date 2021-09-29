import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import ChannelService from './channels/channel.service';
import { Channel } from './channels/channel.entity';
import { User } from './users/users.entity';
import { UsersService } from './users/users.service';
import MessageService from './messages/message.service';
import { AuthService } from './auth/auth.service';
export declare class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly channelService;
    private readonly authService;
    private readonly userService;
    private readonly messageService;
    server: Server;
    private logger;
    private clients;
    constructor(channelService: ChannelService, authService: AuthService, userService: UsersService, messageService: MessageService);
    handleMessage(client: Socket, data: any): Promise<void>;
    sendNewMessage(room: string, msg: Object): Promise<void>;
    afterInit(server: Server): void;
    test(arg: any): void;
    handleDisconnect(client: Socket): void;
    handleConnection(client: Socket, ...args: any[]): Promise<void>;
    leaveChannel(channel: Channel, user: User): Promise<void>;
    joinChannel(channel: Channel, user: User): Promise<void>;
}
