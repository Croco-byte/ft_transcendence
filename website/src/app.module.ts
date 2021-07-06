import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection, getConnectionOptions} from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/users.entity';
import { join } from 'path';

@Module(
{
	imports: [
		TypeOrmModule.forRoot(
		{
			type: "postgres",
			host: "postgres",
			port: 5432,
			username: "root",
			password: "password",
			database: "ft_transcendance",
			synchronize: true,
			logging: false,
			entities:
			[
				join(__dirname, '**', '*.entity.{ts,js}')

			],
			migrations:
			[
				"src/**/*.migration.ts"
			],
			subscribers:
			[
				"src/**/*.subscriber.ts"
			]
		}),
	],
	controllers: [AppController],
	providers: [AppService],
})

export class AppModule
{
	constructor(private connection: Connection) {}
}
