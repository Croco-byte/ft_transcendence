import { Channel } from 'src/channels/channel.entity';
import { Message } from 'src/messages/message.entity';
import { FriendRequestEntity } from './friends-request.entity';
import { BaseEntity } from 'typeorm';
import { MatchHistoryEntity } from 'src/users/match-history.entity';
export declare class User extends BaseEntity {
    id: number;
    username: string;
    password: string;
    is_admin: string;
    is_blocked: boolean;
    avatar: string;
    score: number;
    status: string;
    messages: Message[];
    blocked: User[];
    channels: Channel[];
    own_channels: Channel[];
    isTwoFactorAuthenticationEnabled?: boolean;
    twoFactorAuthenticationSecret?: string;
    displayname?: string;
    sentFriendRequests?: FriendRequestEntity[];
    receivedFriendRequests?: FriendRequestEntity[];
    matchesWon?: MatchHistoryEntity[];
    matchesLost?: MatchHistoryEntity[];
    wins: number;
    loses: number;
    roomId: string;
    pending_channels: Channel[];
    toPublic(): {
        id: number;
        username: string;
        avatar: string;
        score: number;
        status: string;
    };
}
