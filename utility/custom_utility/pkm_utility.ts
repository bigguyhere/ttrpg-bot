export enum Type {
    NORMAL,
    FIRE,
    WATER,
    ELECTRIC,
    GRASS,
    ICE,
    FIGHTING,
    POISON,
    GROUND,
    FLYING,
    PSYCHIC,
    BUG,
    ROCK,
    GHOST,
    DRAGON,
    DARK,
    STEEL,
    FAIRY,
    NONE
};

// I tried to do this with an enum but enums in js aren't working with me at the moment
export const Games : {[id : string] : number} = {
    'red-blue': 0,
    'yellow': 1,
    'gold-silver': 2,
    'crystal': 3,
    'ruby-sapphire': 4,
    'emerald': 5,
    'firered-leafgreen': 6,
    'diamond-pearl': 7,
    'platinum': 8,
    'heartgold-soulsilver': 9,
    'black-white': 10,
    'colosseum': 11,
    'xd': 12,
    'black-2-white-2': 13,
    'x-y': 14,
    'omega-ruby-alpha-sapphire': 15,
    'sun-moon': 16,
    'ultra-sun-ultra-moon': 17,
    'lets-go-pikachu-lets-go-eevee': 18,
    'sword-shield': 19,
    'the-isle-of-armor': 20,
    'the-crown-tundra': 21,
    'brilliant-diamond-and-shining-pearl': 22,
    'legends-arceus': 23,
    'scarlet-violet': 24,
    'the-teal-mask': 25,
    'the-indigo-disk': 26
};

/*export type Status = {
    names: string[];
    emoji: string;
};
export const StatusEffect : {[id : string] : Status} = {
    BURN : {names: ["burn", "burned"], emoji: "🔥"},
    FROZEN : {names: ["frozen", "freeze", "froze"], emoji: "❄️"},
    FROSTBITE : {names: ["frostbite", "frosbitten"], emoji: "🧊"},
    PARALYSIS : {names: ["paralysis", "paralyzed", "paralyze"], emoji: "⚡"},
    POISONED : {names: ["poisoned", "poison"], emoji: "☠️"},
    BADLY_POISONED : {names: ["badly poisoned", "badly poison"], emoji: "🤮"},
    ASLEEP : {names: ["asleep", "sleep", "unconscious", "sleeping"], emoji: "💤"},
    DROWSY : {names: ["sleepy", "drowsy", "yawning", "tired"], emoji: "🥱"},
    CONFUSION : {names: ["confuse", "confusion", "confused", "dizzy"], emoji: "💫"},
    FLINCHING : {names: ["flinch", "flinching", "flinched"], emoji: "❌"},
    INCREASESTAT : {names: ["up", "increase", "boost"], emoji:"🔺"},
    DECREASESTAT : {names: ["down", "decrease", "lower"], emoji: "🔻"}
};*/

export type Status = {
    name: string;
    value: number;
    emoji: string;
};

export const StatusEffect : {[id : string] : string} = {
    burn : "🔥",
    freeze : "❄️",
    paralysis : "⚡",
    poison : "☠️",
    sleep : "💤",
    confusion : "💫",
    infatuation : "😍",
    trap: "🪤",
    flinch: "❌",
    increaseStat : "🔺",
    decreaseStat : "🔻"
};

export const EmojiTypeMap : {[id : string] : string} = {
    NORMAL: "◽",
    FIRE: "🔥",
    WATER: "🌊",
    ELECTRIC: "⚡",
    GRASS: "🌳",
    ICE: "❄️",
    FIGHTING: "🤜",
    POISON: "☠️",
    GROUND: "⛰️",
    FLYING: "🐦",
    PSYCHIC: "🔮",
    BUG: "🪲",
    ROCK: "🪨",
    GHOST: "👻",
    DRAGON: "🐉",
    DARK: "😈",
    STEEL: "⚔️",
    FAIRY: "🧚",
    NONE: "❌"
};

export const TypeEffectMatrix : number[][] = 
[
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0, 1, 1, 0.5, 1], //Normal
    [1, 0.5, 0.5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 0.5, 1, 0.5, 1, 2, 1], //Fire
    [1, 2, 0.5, 1, 0.5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0.5, 1, 1, 1], //Water
    [1, 1, 2, 0.5, 0.5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0.5, 1, 1, 1], //Electric
    [1, 0.5, 2, 1, 0.5, 1, 1, 0.5, 2, 0.5, 0, 0.5, 2, 1, 0.5, 1, 0.5, 1], //Grass
    [0, 0.5, 0.5, 1, 2, 0.5, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 0.5, 1], //Ice
    [2, 1, 1, 1, 1, 2, 1, 0.5, 1, 0.5, 0.5, 0.5, 2, 0, 1, 2, 2, 0.5], //Fighting
    [1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0, 2], //Poison
    [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2, 1], //Ground
    [1, 1, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 0.5, 1], //Flying
    [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 0, 0.5, 1], //Psychic
    [1, 0.5, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 0.5, 0.5], //Bug
    [1, 2, 1, 1, 1, 2, 0.5, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 0.5, 1], //Rock
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 1], //Ghost
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0.5, 0], //Dragon
    [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 0.5], //Dark
    [1, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5, 2], //Steel
    [1, 0.5, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 2, 2, 0.5, 1] //Fairy
];

module PkmUtilityFunctions{

    export function formatTitle(str : string) : string {
        str = formatUpperCase(str);
        const splitStr = str.split('-');

        if(splitStr.length !== 2){
            return str;
        } 

        return `${splitStr[0]} (${splitStr[1]})`;
    }

    export function formatStr(str : string) : string {
        str = str.trim();
        let retStr = '';
        let nextUpper = true;

        for(let c of str){
            if(c === '-'){
                retStr += ' ';
                nextUpper = true;
            } else {
                if(nextUpper){
                    retStr += c.toUpperCase();
                } else {
                    retStr += c;
                }
                nextUpper = false;
            }
        }

        return retStr;
    }

    export function formatUpperCase(name : string) : string {
        name = name.trim();

        if(name.length < 1){
            return name;
        }

        return name[0].toUpperCase() + name.substring(1, name.length);
    }

    export function typeCalculate(attack : Type, defender: [type1 : Type, type2 : Type]) : number{

        if(attack === Type.NONE || defender[0] === Type.NONE){
            return -1
        }

        const length = defender[1] === Type.NONE ? 1 : 2;

        let effectiveness = 1;
        for(let i = 0; i < length; ++i){
            effectiveness *= TypeEffectMatrix[attack][defender[i]];
        }

        return effectiveness;
    }

    export function getWeaknesses(types: [type1 : Type, type2 : Type]): [string, number][]{

        const keys = Object.keys(Type).filter((k) => !isNaN(Number(k)));
        let weaknesses : [string, number][] = [];

        keys.forEach((key, ind) => {
                const value = typeCalculate(ind, types);
                if(value > 1){
                    weaknesses.push([Type[ind], value]);
                } 
        });

        return weaknesses;
    }
}

export { PkmUtilityFunctions }