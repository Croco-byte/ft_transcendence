import { Channel } from 'src/channels/channel.entity';
import { User } from 'src/users/users.entity';
import { BaseEntity } from 'typeorm';
export declare class Channel_muted_user extends BaseEntity {
    id: number;
    channel: Channel;
    user: User;
    to: string;
}
