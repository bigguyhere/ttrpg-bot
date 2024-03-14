import { UtilityFunctions } from "../../utility/general"

export enum Type {
    NORMAL,
    FIGHTING,
    FLYING,
    POISON,
    GROUND,
    ROCK,
    BUG,
    GHOST,
    STEEL,
    FIRE,
    WATER,
    GRASS,
    ELECTRIC,
    PSYCHIC,
    ICE,
    DRAGON,
    DARK,
    FAIRY,
    NONE
};

export const MoveLearnMethod : string[] = [
    'level-up',
    'egg',
    'tutor',
    'machine',
    'none'
];

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
    [1, 1, 1, 1, 1, 0.5, 1, 0, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1], //Normal
    [2, 1, 0.5, 0.5, 1, 2, 0.5, 0, 2, 1, 1, 1, 1, 0.5, 2, 1, 2, 0.5], //Fighting
    [1, 2, 1, 1, 1, 0.5, 2, 1, 0.5, 1, 1, 2, 0.5, 1, 1, 1, 1, 1], //Flying
    [1, 1, 1, 0.5, 0.5, 0.5, 1, 0.5, 0, 1, 1, 2, 1, 1, 1, 1, 1, 2], //Poison
    [1, 1, 0, 2, 1, 2, 0.5, 1, 2, 2, 1, 0.5, 2, 1, 1, 1, 1, 1], //Ground
    [1, 0.5, 2, 1, 0.5, 1, 2, 1, 0.5, 2, 1, 1, 1, 1, 2, 1, 1, 1], //Rock
    [1, 0.5, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 0.5, 1, 2, 1, 2, 1, 1, 2, 0.5], //Bug
    [0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 0.5, 1], //Ghost
    [1, 1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 0.5, 1, 0.5, 1, 2, 1, 1, 2], //Steel
    [1, 1, 1, 1, 1, 0.5, 2, 1, 2, 0.5, 0.5, 2, 1, 1, 2, 0.5, 1, 1], //Fire
    [1, 1, 1, 1, 2, 2, 1, 1, 1, 2, 0.5, 0.5, 1, 1, 1, 0.5, 1, 1], //Water
    [1, 1, 0.5, 0.5, 2, 2, 0.5, 1, 0.5, 0.5, 2, 0.5, 1, 1, 1, 0.5, 1, 1], //Grass
    [1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 2, 0.5, 0.5, 1, 1, 0.5, 1, 1], //Electric
    [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 0.5, 1, 1, 0, 1], //Psychic
    [1, 1, 2, 1, 2, 1, 1, 1, 0.5, 0.5, 0.5, 2, 1, 1, 0.5, 2, 1, 1], //Ice
    [1, 1, 1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 1, 1, 2, 1, 0], //Dragon
    [1, 0.5, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 0.5, 0.5], //Dark
    [1, 2, 1, 0.5, 1, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 1, 1, 2, 2, 1] //Fairy
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

    const sanitized_forms : string[] = ['paldea', 'alola', 'galar', 'hisui', 'mega-x', 'mega-y', 'mega'];

    export function sanitizeFormInput (input : string, name : string) : string {
        UtilityFunctions.errorCheck(!input, `${name} must exist`);
        UtilityFunctions.errorCheck(typeof input !== 'string', `${name} must be a string`);
        input = input.trim().toLowerCase();
        UtilityFunctions.errorCheck(input.length === 0, `${name} cannot be empty`);

        for(var form of sanitized_forms) {
            if(input.includes(form)){
                return form;
            }
        }

        return input;
        
    }

    export function getPkmFormQuery(queryName : string, name : string, param : string) : any {
        const query = `query ${queryName} {
            species: pokemon_v2_pokemonspecies(where: {name: {_eq: "${name}"}}) {
            name
            id
            pokemon: pokemon_v2_pokemons(limit: 1, ${param}) {
                id
                name
                is_default
                types: pokemon_v2_pokemontypes {
                  slot
                  type: pokemon_v2_type {
                      name
                  }
                }
                sprites: pokemon_v2_pokemonsprites(limit: 1) {
                  sprites(path: "front_default")
                }
                abilities: pokemon_v2_pokemonabilities {
                  ability: pokemon_v2_ability {
                      name
                  }
                }
            }
        }
      }`;

      return JSON.stringify({
        query: query,
        operationName: queryName
      });
    }

    export function getPkmMoveQuery(queryName : string, name : string, param : string, moveParam : string) : any {
        const query = `query ${queryName} {
            species: pokemon_v2_pokemonspecies(where: {name: {_eq: "${name}"}}) {
              name
              id
              pokemon: pokemon_v2_pokemons(limit: 1, ${param}) {
                id
                name
                is_default
                sprites: pokemon_v2_pokemonsprites(limit: 1) {
                  sprites(path: "front_default")
                }
                moves: pokemon_v2_pokemonmoves(order_by: {move_id: asc}, distinct_on: move_id ${moveParam}) {
                  id
                  move_learn_method_id
                  move: pokemon_v2_move {
                    type_id
                    name
                    meta: pokemon_v2_movemeta {
                      ailment: pokemon_v2_movemetaailment {
                        name
                      }
                      flinch_chance
                    }
                    stat_changes: pokemon_v2_movemetastatchanges {
                      change
                    }
                  }
                }
              }
            }
          }`;

      return JSON.stringify({
        query: query,
        operationName: queryName
      });
    }

    export function getPkmAbilityQuery(queryName : string, name : string, param : string) : any {
      const query = `query ${queryName} {
        species: pokemon_v2_pokemonspecies(where: {name: {_eq: "${name}"}}) {
          name
          id
          pokemon: pokemon_v2_pokemons(limit: 1, ${param}) {
            id
            name
            is_default
            sprites: pokemon_v2_pokemonsprites(limit: 1) {
              sprites(path: "front_default")
            }
            abilities: pokemon_v2_pokemonabilities {
              ability_id
              id
              is_hidden
              slot
              ability: pokemon_v2_ability {
                name
                id
                effect: pokemon_v2_abilityeffecttexts(where: {language_id: {_eq: 9}}, limit: 1, order_by: {id: desc}) {
                  id
                  language_id
                  short_effect
                }
                flavor: pokemon_v2_abilityflavortexts(where: {language_id: {_eq: 9}}, limit: 1, order_by: {id: desc}) {
                  language_id
                  id
                  flavor_text
                }
              }
            }
          }
        }
      }
      `;

      return JSON.stringify({
        query: query,
        operationName: queryName
      });
    }

    export function getMoveQuery(queryName : string, name : string) : any {
        const query = `query ${queryName} {
            move: pokemon_v2_move(where: {name: {_eq: "${name}"}}) {
              type_id
              name
              meta: pokemon_v2_movemeta {
                ailment: pokemon_v2_movemetaailment {
                  name
                }
                flinch_chance
              }
              stat_changes: pokemon_v2_movemetastatchanges {
                change
              }
              move_target_id
              flavor: pokemon_v2_moveflavortexts(where: {_and: {language_id: {_eq: 9}, flavor_text: {_niregex: ".*recommended that this move is forgotten.*"}}}, order_by: {id: desc}, limit: 1) {
                flavor_text
                language_id
                id
              }
            }
          }
          `;

      return JSON.stringify({
        query: query,
        operationName: queryName
      });
    }

    export function getAbilityQuery(queryName : string, name : string) : any {
      const query = `query ${queryName} {
          ability: pokemon_v2_ability(where: {name: {_eq: "${name}"}}) {
            name
            id
            effect: pokemon_v2_abilityeffecttexts(limit: 1, where: {language_id: {_eq: 9}}, order_by: {id: desc}) {
              language_id
              id
              short_effect
            }
            flavor: pokemon_v2_abilityflavortexts(limit: 1, where: {language_id: {_eq: 9}}, order_by: {id: desc}) {
              flavor_text
              id
              language_id
            }
          }
        }`;

      return JSON.stringify({
        query: query,
        operationName: queryName
      });
    }
}

export { PkmUtilityFunctions }