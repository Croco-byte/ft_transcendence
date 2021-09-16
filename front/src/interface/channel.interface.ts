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
	userRole: 'ADMIN' | 'OWNER' | 'MEMBER'
};