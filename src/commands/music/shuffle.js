function shuffle(array) {
	for(let i = array.length; i; i--) {
		let index = Math.floor(Math.random() * i);
		[array[i - 1], array[index]] = [array[index], array[i - 1]];
	}
}

module.exports = {
	process: async message => {
		let player = bot.players.get(message.channel.guild.id);
		if(!player) {
			return "There is currently no music playing";
		} else if(!player.voiceCheck(message.member)) {
			return "You must be listening to music to use this command";
		} else {
			shuffle(player.queue);
			return "Queue shuffled";
		}
	},
	guildOnly: true,
	description: "Shuffle the queue"
};