import ChannelService from './channel.service';
import { UsersService } from 'src/users/users.service';
import { AppGateway } from 'src/channels/channel.gateway';
import { User } from 'src/users/users.entity';
import MessageService from 'src/messages/message.service';
import { CreateChannelDto, EditTypeDto } from './dto/channel.dto';
export declare class ChannelController {
    private readonly channelService;
    private readonly userService;
    private readonly messageService;
    private readonly websocketGateway;
    private readonly logger;
    constructor(channelService: ChannelService, userService: UsersService, messageService: MessageService, websocketGateway: AppGateway);
    test(req: any): Promise<User[]>;
    createChannel(req: any, body: CreateChannelDto): Promise<{
        id: number;
        message?: undefined;
    } | {
        message: string;
        id: number;
    }>;
    getChannels(req: any): Promise<{
        channels: Object[];
    }>;
    getPublicChannels(req: any): Promise<Object[]>;
    getJoinedChannels(req: any): Promise<Object[]>;
    getDirects(req: any): Promise<Object[]>;
    deleteChannel(channelID: string, req: any): Promise<void>;
    getInfo(channelID: string, req: any): Promise<{
        id: number;
        type: "public" | "private";
        name: string;
        requirePassword: boolean;
        password: string;
        lastMessage: string;
        modifiedDate: Date;
        creationDate: Date;
        isDirect: boolean;
        users: User[];
        administrators: User[];
        owner: User;
        messages: import("../messages/message.entity").Message[];
        mutedUsers: import("./channel_muted_users/channel_muted_user.entity").Channel_muted_user[];
        pending_users: User[];
        invitation_links: import("./invitation_links/invitation_link.entity").InvitationLink[];
    }>;
    addMember(channelID: string, body: any, req: any): Promise<void>;
    getMembers(channelID: string, req: any): Promise<{
        id: number;
        username: string;
        avatar: string;
        score: number;
        status: string;
    }[]>;
    getAdmin(channelID: string, req: any): Promise<{
        id: number;
        username: string;
        avatar: string;
        score: number;
        status: string;
    }[]>;
    addAdmin(channelID: string, body: any, req: any): Promise<{
        message: string;
    }>;
    muteUser(channelID: string, username: string, req: any): Promise<{
        message: string;
    }>;
    unmuteUser(channelID: string, username: string, req: any): Promise<{
        message: string;
    }>;
    banUser(channelID: string, username: string, req: any): Promise<{
        message: string;
    }>;
    unbanUser(channelID: string, username: string, req: any): Promise<{
        message: string;
    }>;
    sendMessage(channelID: string, data: any, req: any): Promise<void>;
    getChannel(channelID: string, req: any): Promise<{
        messages: any;
        user_role: "ADMIN" | "OWNER" | "MEMBER";
    }>;
    changeName(channelID: string, body: any, req: any): Promise<{
        message: string;
    }>;
    changePassword(channelID: string, body: any, req: any): Promise<{
        message: string;
    }>;
    removePassword(channelID: string, body: any, req: any): Promise<{
        message: string;
    }>;
    checkPassword(channelID: string, body: any, req: any): Promise<void>;
    leaveChannel(channelID: string, req: any): Promise<void>;
    kickMember(channelID: string, username: string, req: any): Promise<void>;
    deleteAdmin(channelID: string, username: string, req: any): Promise<void>;
    generateLink(channelID: string, req: any): Promise<{
        link: string;
    }>;
    editType(channelID: string, body: EditTypeDto, req: any): Promise<void>;
}
