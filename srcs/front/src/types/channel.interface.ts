export interface UserInterface
{
	id: number;
	username: string;
	avatar: string;
	score: number;
	status: string;
	isMuted: boolean;
	isBanned: boolean;
	isAdmin: boolean;
	
};

export interface ChannelInterface
{
	id: number,
	name: string,
	requirePassword: boolean,
	password: string,
	messages: Array<any>,
	has_new_message: boolean,
	members: UserInterface[],
	administrators: [],
	user_role: string,
	isJoined: boolean,
	type: "public" | "private",
	isDirect: boolean
};