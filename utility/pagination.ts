import { EmbedBuilder } from "@discordjs/builders"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction } from "discord.js";
const wait = require('node:timers/promises').setTimeout;

module Pagination {
    let embeds: EmbedBuilder[] = []
    let titleStr = ''
    let curPage = 0

    function createButtons() : ActionRowBuilder<ButtonBuilder>{
        const row = new ActionRowBuilder<ButtonBuilder>()

        row.addComponents(
            new ButtonBuilder()
            .setCustomId('prev_btn')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️')
            .setDisabled(curPage == 0)
        )

        row.addComponents(
            new ButtonBuilder()
            .setCustomId('next_btn')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('➡️')
            .setDisabled(curPage == embeds.length - 1)
        )

        return row
    }

    export async function getPaginatedMessage(ebs : EmbedBuilder[], interaction : ChatInputCommandInteraction<CacheType>, 
        topStr : string = ''){
        const channel = interaction.channel
        titleStr = topStr
        embeds = ebs

        const embed = embeds[curPage]

        await interaction.editReply({
            content: titleStr,
            embeds: [embed],
            components: [createButtons()]   
        })


        const collector = channel?.createMessageComponentCollector({
            time: 600000
        })

        if(collector != undefined){
            collector.on('collect', async (btnInteraction) =>{
                if(!btnInteraction){
                    return
                }
                
                try{
                    await btnInteraction.deferUpdate()
                }catch(e){
                    console.log(e)
                }

                if(btnInteraction.customId !== 'prev_btn' && btnInteraction.customId !== 'next_btn'){
                    return
                }

                if(btnInteraction.customId === 'prev_btn' && curPage > 0){
                    --curPage
                } else if (btnInteraction.customId === 'next_btn' && curPage < embeds.length - 1){
                    ++curPage
                }

                await interaction.editReply({
                    content: titleStr,
                    embeds: [embeds[curPage]],
                    components: [createButtons()]
                })

            } ) 
        }
    }
}

export { Pagination }