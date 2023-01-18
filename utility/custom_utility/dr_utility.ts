import { DRSkill } from "../../models/custommodels/drmodels/drskill";
import { parse } from 'csv-parse';
import mysql from 'mysql'
import * as fs from "fs";
import * as path from "path";
import { UtilityFunctions } from "../general";

type SkillType = {
    SkillName: string;
    Prereqs: string;
    SPCost: number;
    Description: string;
};

module DRUtilityFunctions{
    export function importGeneralSkills(db : mysql.Connection, tableNameBase : string){
        const stream = fs.readFileSync(
            path.resolve(__dirname, 'generalSkills.csv'),
             { encoding: 'utf-8' });
        const columnNames = ['SkillName','Prereqs','SPCost','Description']

        const parser = parse(stream, {
            delimiter: ';',
            columns: columnNames,
            relax_quotes: true
        },
        (err, res : SkillType[]) => {
            if(err){
                console.log(err)
            }
            
            for(const skill of res) {
                console.log(skill.SkillName)
                new DRSkill(
                    UtilityFunctions.formatString(skill.SkillName),
                    UtilityFunctions.formatString(skill.Prereqs),
                    UtilityFunctions.formatString(skill.Description),
                    skill.SPCost,
                    'GEN').addToTable(db, tableNameBase)
            }

        }
        );

    }
}

export {DRUtilityFunctions}