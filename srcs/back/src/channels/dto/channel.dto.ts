import { IsDefined, IsNotEmpty } from "class-validator";

export class CreateChannelDto
{
	@IsDefined()
	@IsNotEmpty()
	name: string;

	@IsDefined()
	@IsNotEmpty()
	isDirect: boolean;

	to_user: string;
}

export class EditTypeDto
{
	@IsDefined()
	@IsNotEmpty()
	type: "public" | "private";
}
