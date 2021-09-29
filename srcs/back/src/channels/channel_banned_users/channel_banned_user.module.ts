import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import ChannelBannedUserRepository from './channel_banned_user.repository';
import ChannelBannedUserService from './channel_banned_user.service';

@Module(
{
	imports: [
		TypeOrmModule.forFeature([ChannelBannedUserRepository])
	],
	controllers: [],
	providers: [ChannelBannedUserService],
})

export class ChannelBannedUserModule {};