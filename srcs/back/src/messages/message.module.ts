import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection, getConnectionOptions} from 'typeorm';
import MessageRepository from './message.repository';
import MessageService from './message.service'

@Module(
{
	imports: [
		TypeOrmModule.forFeature([MessageRepository])
	],
	controllers: [],
	exports: [MessageService],
	providers: [MessageService],
})

export class MessageModule {};