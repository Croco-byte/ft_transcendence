import { User } from 'src/users/users.entity';
import { BaseEntity } from 'typeorm';
import { Channel_muted_user } from 'src/channels/channel_muted_users/channel_muted_user.entity';
import { Message } from 'src/messages/message.entity';
import { InvitationLink } from './invitation_links/invitation_link.entity';
declare class Channel extends BaseEntity {
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
    messages: Message[];
    mutedUsers: Channel_muted_user[];
    pending_users: User[];
    invitation_links: InvitationLink[];
    toJSON(): {
        id: number;
        type: "public" | "private";
        name: string;
        requirePassword: boolean;
        password: string;
        creationDate: Date;
        users: any[];
        isDirect: boolean;
    };
}
export { Channel };
