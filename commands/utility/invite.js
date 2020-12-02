module.exports = {
	name: 'invite',
	description: 'get invite link for the bot',
	cooldown: 2,
	execute(message, args, d) {
		const invite = 'https://discord.com/oauth2/authorize?client_id=743833062265323651&scope=bot&permissions=8';
		const inviteEmbed = new d.Discord.MessageEmbed()
			.setColor('#dd2de0')
			.setTitle('Invite')
			.setURL(invite)
		message.channel.send(inviteEmbed);
	}
};
