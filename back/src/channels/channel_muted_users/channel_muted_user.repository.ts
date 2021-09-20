import { Injectable } from "@nestjs/common";
import { EntityRepository, Repository } from "typeorm";
import { Channel_muted_user } from "./channel_muted_user.entity";

@EntityRepository(Channel_muted_user)
export default class ChannelMutedUserRepository extends Repository<Channel_muted_user>
{

};
