import { UsersService } from "src/users/users.service";
import ChannelService from "../channel.service";
import { InvitationService } from "./invitation.service";
export declare class InvitationController {
    private service;
    private userService;
    private channelService;
    constructor(service: InvitationService, userService: UsersService, channelService: ChannelService);
    joinChannel(invitation_id: string, req: any): Promise<{
        channel_name: string;
    }>;
}
