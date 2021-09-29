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
    sendNewMessage(room: string, msg: Object, user: User, channel: Channel): Promise<void>;
    kickMember(user: User, channel: Channel): Promise<void>;
    addMember(room: string, msg: string, channel: Channel): Promise<void>;
    notifChannel(room: string, notif: string, msg: string, channel: Channel): Promise<void>;
    afterInit(server: Server): void;
    handleDisconnect(client: Socket): void;
    handleConnection(client: Socket, ...args: any[]): Promise<void>;
    leaveChannel(channel: Channel, user: User): Promise<void>;
    joinChannel(channel: Channel, user: User): Promise<void>;
    getSocketByUser(search: User): Socket;
}
