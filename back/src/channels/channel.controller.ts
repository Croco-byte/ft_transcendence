import { Controller, Req, Logger, Get, Post, Patch, Delete, Query, Param, Body } from '@nestjs/common';
import { request, Request } from 'express';
import { AppService } from 'src/app.service';

@Controller('channels')
export class ChannelController
{
	private readonly logger = new Logger(ChannelController.name);

	constructor(private readonly appService: AppService)
	{

	}

	@Post()
	createChannel(@Body() body)
	{
		let name = body.name;
		this.logger.log("Create new channel named '" + name + "'");
		return {message: "Channel " + name + " successfully created"};
	}

	@Post(":channelID/members")
	addUser(@Body() body)
	{
		let username = body.username;
		this.logger.log("Add user '" + username + "' to this channel");
		return {message: "User " + username + " added successfully"};
	}

	@Post(":channelID/admin")
	addAdmin(@Body() body)
	{
		let username = body.username;
		this.logger.log("New admin (user : '" + username + "') in this channel");
		return {message: "Administrator '" + username + "' added successfully"};
	}

	@Post(":channelID/members/mute")
	muteUser(@Body() body)
	{
		let id = body.id;
		this.logger.log("Mute user '" + id + "' to this channel");
		return {message: "User " + id + " muted successfully"};
	}

	@Post(":channelID/members/ban")
	banUser(@Body() body)
	{
		let id = body.id;
		this.logger.log("Mute user '" + id + "' to this channel");
		return {message: "User " + id + " banned successfully"};
	}

	// @Post(":channelID/messages")
	// addMessage(@Body() body)
	// {
	// 	let message = body.message;
	// 	this.logger.log("Send message '" + message + "' to this channel");
	// 	return {message: "Message '" + message + "' sent successfully"};
	// }

	@Get(":channelID/messages")
	getMessages()
	{
		this.logger.log("Get message of this channel");
		return {
			messages: [
				{
					author: "Yass",
					content: "Je suis un test !"
				}
			]
		};
	}

	@Patch(":channelID/name")
	changeName(@Body() body)
	{
		let newName = body.new_name;
		this.logger.log("This channel renamed '" + newName + "'");
		return {message: "Channel renamed to '" + newName + "' successfully"};
	}

	@Patch(":channelID/password")
	changePassword(@Body() body)
	{
		let password = body.password;
		this.logger.log("Set password of this channel to '" + password + "'");
		return {message: "Password changed successfully to '" + password + "'"};
	}

	@Delete(":channelID/password")
	removePassword(@Body() body)
	{
		this.logger.log("Password removed for this channel");
		return {message: "Password removed successfully"};
	}

	@Get()
	getHello(@Body() body)
	{
		return {message: "Je suis le controller channel"};
	}
}
