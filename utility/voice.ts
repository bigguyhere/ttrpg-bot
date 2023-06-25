import {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
    AudioPlayer,
    VoiceConnection,
} from '@discordjs/voice';
import { Channel, ChannelType } from 'discord.js';
var Path = require("path");

export module VoiceFunctions{
    export async function playAudio(file : string) : Promise<AudioPlayer>{
        const resource = createAudioResource(Path.join(Path.dirname(__dirname), file), {
            inputType: StreamType.Arbitrary,
        });

        const audioPlayer = createAudioPlayer()
        audioPlayer.play(resource);
    
        return await entersState(audioPlayer, AudioPlayerStatus.Playing, 5000);
    }

    export async function setIdleDisconnect(audioPlayer : AudioPlayer, connection : VoiceConnection, duration : number){
        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            setTimeout(() => {
              connection.disconnect();
            }, duration);
          })
    }

    export async function getConnection(voiceChannel: Channel | null) : Promise<VoiceConnection | null>{
        
        if(voiceChannel == null || voiceChannel.type !== ChannelType.GuildVoice){
            return null
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });
    
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000).catch(err => {
            connection.destroy();
            throw err
        });
        
        return connection;
    }
}