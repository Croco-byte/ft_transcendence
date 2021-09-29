import { BaseEntity } from "typeorm";
import { Channel } from "../channel.entity";
export declare class InvitationLink extends BaseEntity {
    id: number;
    channel: Channel;
    path: string;
}
