class GameService {
	
	/**
	 * Use to trigger everytime beforeRouteUpdate even if all other params didn't change.
	 */
	generateRandomStr() : string
	{
		const length: number = 12;
		const charset: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let retVal: string = "";
		
		for (var i = 0, n = charset.length; i < length; ++i) {
			retVal += charset.charAt(Math.floor(Math.random() * n));
		}
		return retVal;
	}
}

export default new GameService();