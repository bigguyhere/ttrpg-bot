import mysql from 'mysql'

export class Initiative {
    public initID: number
    constructor(public name: string,
                public rollValue: number,
                public position: number){
        this.initID = -1
        this.name = name
        this.rollValue = rollValue
        this.position = position
    }
}