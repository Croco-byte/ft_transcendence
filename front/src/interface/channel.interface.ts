export default interface ChannelInterface
{
	id: number,
	name: string,
	requirePassword: boolean,
	password: string,
	messages: Array<any>,
	has_new_message: boolean,
	members: [],
	administrators: [],
	user_role: string,
	isJoined: boolean,
	type: "public" | "private",
	isDirect: boolean
};