const { Util } = require('discord.js');
const ytdl = require('ytdl-core');
const youtube = require('youtube-sr');
const ytpl = require('ytpl');
module.exports = {
	name: 'play',
	description: 'play music, either do play <search> or play <youtube_url>',
	aliases: ['p'],
	cooldown: 2,
	async execute(message, args, d) {
		const { channel } = message.member.voice;
		if (!channel) return message.channel.send('Get in a voice channel if you wanna play music!');
		const permissions = channel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) return message.channel.send('Bruh I don\'t have perms to connect');
		if (!permissions.has('SPEAK')) return message.channel.send('Bruh I don\'t have perms to speak');

		const ytRegex = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
		const plRegex = /[&?]list=([^&]+)/i;
		const serverQueue = message.client.queue.get(message.guild.id);
		const argument = args.join(' ');
		let songInfo;
		if (ytRegex.test(argument) && plRegex.test(argument)) {
			
			const playlist = await youtube.getPlaylist('https://www.youtube.com/playlist?list=PLAuXvMFaTiZwojnLr7JLOupJCikzwShYH');
			console.log(playlist)
			for (video in playlist.videos) {
				let plSong = playlist.videos[video];
				var tempArray = [];
				const song = {
					title: Util.escapeMarkdown(plSong.title),
					url: `https://www.youtube.com/watch?v=${plSong.id}`,
					duration: plSong.durationFormatted,
					thumbnail: plSong.thumbnail
				};
				tempArray.push(song);
			}
			if (serverQueue) { serverQueue.songs.push(...tempArray); }

		}
		else {
			songInfo = await youtube.searchOne(argument);
			var song = {
				title: Util.escapeMarkdown(songInfo.title),
				url: songInfo.url,
				duration: songInfo.durationFormatted,
				thumbnail: songInfo.thumbnail.url
			};
		}


		if (serverQueue) {
			serverQueue.songs.push(song);
			const added = new d.Discord.MessageEmbed()
				.setColor('#dd2de0')
				.setTitle(song.title)
				.setURL(song.url)
				.setDescription(`Duration: ${song.duration}`)
				.setThumbnail(song.thumbnail)
				.addField('Added to the queue!', '_')
				.setTimestamp()
				.setFooter('DJ Grape');
			return message.channel.send(added);
		}

		const queueConstruct = {
			textChannel: message.channel,
			voiceChannel: channel,
			connection: null,
			songs: [],
			volume: 2,
			playing: true,
			repeatMode: 0,
		};

		message.client.queue.set(message.guild.id, queueConstruct);
		queueConstruct.songs.push(song);

		const play = async song => {
			const queue = message.client.queue.get(message.guild.id);
			if (!song) { return; }

			let stream = ytdl(song.url, {
				filter: "audioonly",
				quality: "highestaudio"
			});

			const dispatcher = queue.connection.play(stream)
				.on('finish', () => {
					if (queue.repeatMode === 0) { queue.songs.shift(); }
					else if (queue.repeatMode === 2) { queue.songs.push(queue.songs.shift()); }
					else { null; }
					play(queue.songs[0]);
				})
				.on('error', error => console.error(error));
			dispatcher.setVolumeLogarithmic(queue.volume / 5);
			const started = new d.Discord.MessageEmbed()
				.setColor('#dd2de0')
				.setTitle(song.title)
				.setURL(song.url)
				.setDescription(`Duration: ${song.duration}`)
				.setThumbnail(song.thumbnail)
				.addField('Groovin to the tunes!', '_')
				.setTimestamp()
				.setFooter('DJ Grape');
			queue.textChannel.send(started);
		};

		try {
			const connection = await channel.join();
			queueConstruct.connection = connection;
			play(queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			message.client.queue.delete(message.guild.id);
			await channel.leave();
			return message.channel.send(`I could not join the voice channel: ${error}`);
		}
	}
};
