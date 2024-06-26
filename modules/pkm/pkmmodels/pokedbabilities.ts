import DiscordJS, { Client, EmbedBuilder } from "discord.js";
import { PkmUtilityFunctions } from "../pkm_utility";
import { PokeDBPKM } from "./pokedbpkm";
import { ActiveGame } from "../../../models/activegame";

export class PokeDBAbility {
    public effect: string | null = null;
    public flavor: string | null = null;

    constructor(public name: string, data: any | null) {
        this.name = PkmUtilityFunctions.formatStr(name);
        if (data) {
            const flavor = data["flavor"];
            if (flavor && Array.isArray(flavor) && flavor.length == 1) {
                this.flavor = flavor[0]["flavor_text"] as string;
            }

            const effect = data["effect"];
            if (effect && Array.isArray(effect) && effect.length == 1) {
                this.effect = effect[0]["short_effect"] as string;
            }
        }
    }

    public static async getAbilityList(
        data: any | null
    ): Promise<PokeDBAbility[]> {
        let abilitiesList: PokeDBAbility[] = [];
        if (data["abilities"] && Array.isArray(data["abilities"])) {
            for (let i = 0; i < data["abilities"].length; ++i) {
                const ability = data["abilities"][i]["ability"];

                abilitiesList.push(new PokeDBAbility(ability["name"], ability));
            }
        }

        return abilitiesList;
    }

    public async buildViewEmbed(
        user: DiscordJS.User,
        client: Client<boolean>,
        activeGame: ActiveGame
    ): Promise<EmbedBuilder> {
        let descStr = `**DM:** ${await client.users.fetch(activeGame.DM)}\n
                        **Flavor:** ${this.flavor}\n
                        **Effect:** ${this.effect}\n`;

        return new EmbedBuilder()
            .setColor(0x7852a9)
            .setTitle(`**${this.name}**`)
            .setAuthor({
                name: `${user.username}`,
                iconURL: String(user.displayAvatarURL()),
            })
            .setDescription(descStr)
            .setTimestamp();
    }

    public static async buildSummaryEmbed(
        user: DiscordJS.User,
        client: Client<boolean>,
        activeGame: ActiveGame,
        pkm: PokeDBPKM,
        abilities: Array<PokeDBAbility> | null
    ): Promise<EmbedBuilder[] | null> {
        if (abilities == null) {
            return null;
        }

        let embeds: EmbedBuilder[] = [];
        const numEmbeds = abilities.length;

        for (let i = 0; i < numEmbeds; ++i) {
            embeds.push(
                new EmbedBuilder()
                    .setColor(0x7852a9)
                    .setTitle(`**${pkm.name} - ${abilities[i].name}**`)
                    .setAuthor({
                        name: `${user.username}`,
                        iconURL: String(user.displayAvatarURL()),
                    })
                    .setThumbnail(pkm.imageURL)
                    .setTimestamp()
            );

            embeds[i].setDescription(`**DM:** ${await client.users.fetch(
                activeGame.DM
            )}\n
                                    **Flavor:** ${abilities[i].flavor}\n
                                    **Effect:** ${abilities[i].effect}\n`);
        }

        return embeds;
    }
}
