import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection, getConnectionOptions} from 'typeorm';
import ChannelMutedUserRepository from './channel_muted_user.repository';
import ChannelMutedUserService from './channel_muted_user.service';

@Module(
{
	imports: [
		TypeOrmModule.forFeature([ChannelMutedUserRepository])
	],
	controllers: [],
	providers: [ChannelMutedUserService],
})

export class ChannelMutedUserModule {};