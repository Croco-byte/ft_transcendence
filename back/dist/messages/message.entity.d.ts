import { Channel } from "src/channels/channel.entity";
import { User } from "src/users/users.entity";
import { BaseEntity } from "typeorm";
export declare class Message extends BaseEntity {
    id: number;
    user: User;
    channel: Channel;
    content: string;
}
