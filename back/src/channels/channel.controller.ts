import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from 'src/app.service';

@Controller('channel')
export class ChannelController
{
	constructor(private readonly appService: AppService)
	{
		
	}

	@Get()
	@Render('index/index')
	getHello()
	{
		return {message: "Je suis le controller channel"};
	}
}
