import { Injectable } from "@nestjs/common";
import { EntityRepository, Repository } from "typeorm";
import { Channel_banned_user } from "./channel_banned_user.entity";

@EntityRepository(Channel_banned_user)
export default class ChannelBannedUserRepository extends Repository<Channel_banned_user>
{

};
