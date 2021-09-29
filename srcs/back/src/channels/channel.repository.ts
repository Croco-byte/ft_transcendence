import { EntityRepository, Repository } from "typeorm";
import { Channel } from "./channel.entity";

@EntityRepository(Channel)
export default class ChannelRepository extends Repository<Channel>
{

};
