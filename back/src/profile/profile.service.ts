import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/users.entity';


@Injectable()
export class ProfileService {
	constructor() {}

	async getAccountInfo() {
		try {
			return await User.find();
		}
		catch (e) {
			throw new UnauthorizedException();
		}
	}
}
