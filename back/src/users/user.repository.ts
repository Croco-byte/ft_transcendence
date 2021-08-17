import { EntityRepository, Repository } from "typeorm";
import { User } from "./users.entity";

@EntityRepository(User)
export default class UserRepository extends Repository<User>
{

};