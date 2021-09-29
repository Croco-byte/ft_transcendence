import { Repository } from "typeorm";
import { Channel } from "../channel.entity";
import { InvitationLink } from "./invitation_link.entity";
export declare class InvitationService {
    private repository;
    constructor(repository: Repository<InvitationLink>);
    getLink(id: string): Promise<InvitationLink>;
    removeLink(link: InvitationLink): Promise<void>;
    insertLink(channel: Channel, hash: string): Promise<InvitationLink>;
}
