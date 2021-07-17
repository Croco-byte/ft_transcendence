import { Controller, Req, Logger, Get, Post, Put, Delete } from '@nestjs/common';
import { request, Request } from 'express';
import { AppService } from 'src/app.service';

@Controller('channel')
export class ChannelController
{
	private readonly logger = new Logger(ChannelController.name);

	constructor(private readonly appService: AppService)
	{

	}

	@Post("create")
	createChannel(@Req() request: Request)
	{
		let name = request.query['name'];
		this.logger.log("Create new channel named '" + name + "'");
		return {message: "Channel successfully created"};
	}

	@Post(":channelID/users")
	addUser(@Req() request: Request)
	{
		let id = request.query['id'];
		this.logger.log("Add user '" + id + "' to this channel");
		return {message: "User added successfully"};
	}

	@Post(":channelID/users/mute")
	muteUser(@Req() request: Request)
	{
		let id = request.query['id'];
		this.logger.log("Mute user '" + id + "' to this channel");
		return {message: "User muted successfully"};
	}

	@Post(":channelID/users/ban")
	banUser(@Req() request: Request)
	{
		let id = request.query['id'];
		this.logger.log("Mute user '" + id + "' to this channel");
		return {message: "User banned successfully"};
	}

	@Post(":channelID/messages")
	addMessage(@Req() request: Request)
	{
		let message = request.query['message'];
		this.logger.log("Send message '" + message + "' to this channel");
		return {message: "Message sent successfully"};
	}

	@Get(":channelID/messages")
	getMessages()
	{
		this.logger.log("Get message of this channel");
		return {
			messages: [
				{
					userID: 0,
					username: "Yass",
					message: "Je suis un test"
				}
			]
		};
	}

	@Put(":channelID/name")
	changeName(@Req() request: Request)
	{
		let newName = request.query['name'];
		this.logger.log("This channel renamed '" + newName + "'");
		return {message: "Channel renamed successfully"};
	}

	@Post(":channelID/admin")
	addAdmin(@Req() request: Request)
	{
		let adminID = request.query['id'];
		this.logger.log("New admin (user : '" + adminID + "') in this channel");
		return {message: "Administrator added successfully"};
	}

	@Post(":channelID/password")
	activePassword(@Req() request: Request)
	{
		let password = request.query['password'];
		this.logger.log("Set private this channel protected by password '" + password + "'");
		return {message: "Password added successfully"};
	}

	@Put(":channelID/password")
	changePassword(@Req() request: Request)
	{
		let password = request.query['password'];
		this.logger.log("Change password of this channel to '" + password + "'");
		return {message: "Password changed successfully"};
	}

	@Delete(":channelID/password")
	removePassword(@Req() request: Request)
	{
		this.logger.log("Password removed for this channel");
		return {message: "Password removed successfully"};
	}

	@Get()
	getHello(@Req() request: Request)
	{
		console.log(request.query['a']);
		return {message: "Je suis le controller channel"};
	}
}
