import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection, getConnectionOptions} from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/users.entity';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChannelController } from './channels/channel.controller';
import { AppGateway } from './app.gateway';

@Module(
{
	imports: [
		// TypeOrmModule.forRoot(
		// {
		// 	type: "postgres",
		// 	host: "postgres",
		// 	port: 5432,
		// 	username: "root",
		// 	password: "password",
		// 	database: "ft_transcendance",
		// 	synchronize: true, 
		// 	logging: false,
		// 	entities:
		// 	[
		// 		join(__dirname, '**', '*.entity.{ts,js}')
		// 	],
		// 	migrations:
		// 	[
		// 		"src/**/*.migration.ts"
		// 	],
		// 	subscribers:
		// 	[
		// 		"src/**/*.subscriber.ts"
		// 	]
		// }),
		AuthModule,
		UsersModule
	],
	controllers: [AppController, ChannelController],
	providers: [AppService, AppGateway],
})

export class AppModule
{
	// constructor(private connection: Connection) {}
}
