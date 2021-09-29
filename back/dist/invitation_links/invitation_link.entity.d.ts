import { BaseEntity } from "typeorm";
import { Channel } from "../channels/channel.entity";
export declare class InvitationLink extends BaseEntity {
    id: number;
    channel: Channel;
    path: string;
}
