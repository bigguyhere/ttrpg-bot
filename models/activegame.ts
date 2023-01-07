import mysql from 'mysql'

export class ActiveGame{

    constructor(public serverID : string | null,
                public gameName : string | null,
                public gameType : string | null,
                public DM : string,
                public isActive : boolean,
                public defaultRoll : string,
                public round : number,
                public turn : number,
                public hideHP : boolean,
                public channelID : string | null,
                public messageID : string | null){
        this.serverID = serverID;
        this.gameName = gameName;
        this.gameType = gameType;
        this.DM = DM;
        this.isActive = isActive;
        this.defaultRoll = defaultRoll
        this.round = round
        this.turn = turn
        this.hideHP = hideHP
        this.channelID = channelID
        this.messageID = messageID
    }

    public static createTable(db : mysql.Connection): boolean {

        db.query(`CREATE TABLE IF NOT EXISTS ActiveGames ( 
            SERV_ID varchar(255) NOT NULL,
            GameName varchar(255) NOT NULL,
            GameType varchar(255),
            DM varchar(255) NOT NULL,
            isActive BOOLEAN,
            DefaultRoll varchar(50),
            Round INT,
            Turn INT,
            HideHP BOOLEAN,
            MessageID varchar(255),
            ChannelID varchar(255),
            PRIMARY KEY (SERV_ID, GameName));`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    private inactivizeGames(db : mysql.Connection): void{
        db.query(`UPDATE ActiveGames SET isActive = 0 WHERE isActive = 1 and SERV_ID = ${this.serverID};`, (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        })  
    }

    addToTable(db : mysql.Connection): boolean{

        //Sets currently active game(s) to inactive
        this.inactivizeGames(db)

        //Inserts new game to the game table, set as the active game
        db.query(`INSERT INTO ActiveGames (SERV_ID, GameName, GameType, DM, isActive, Round, Turn, HideHP, MessageID, ChannelID)
        VALUES (${this.serverID}, "${this.gameName}", "${this.gameType}", ${this.DM}, ${this.isActive}, 
                ${this.round}, ${this.turn}, ${this.hideHP}, ${this.messageID}, ${this.channelID});`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
            
        })

        return true
    }

    setDM(db : mysql.Connection): boolean{

        db.query(`UPDATE ActiveGames SET DM = '${this.DM}' 
                    WHERE GameName = '${this.gameName}' and SERV_ID = ${this.serverID};`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
            
        })

        return true
    }

    updateInit(db : mysql.Connection, 
                newChnnlID : string | null, 
                newMsgID : string | null,
                newRoll: string,
                newRound: number,
                newTurn: number,
                newHideHP: boolean): boolean{

        this.channelID = newChnnlID
        this.messageID = newMsgID
        this.defaultRoll = newRoll
        db.query(`UPDATE ActiveGames SET MessageID = ${newMsgID},
                                            ChannelID = ${newChnnlID},
                                            DefaultRoll = '${newRoll}',
                                            Round = ${newRound},
                                            Turn = ${newTurn},
                                            HideHP = ${newHideHP}
                    WHERE GameName = '${this.gameName}' and SERV_ID = ${this.serverID};`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
            
        })

        return true
    }

    changeGame(db : mysql.Connection): boolean{

        this.inactivizeGames(db)

        db.query(`UPDATE ActiveGames SET isActive = 1 WHERE GameName = '${this.gameName}' and SERV_ID = ${this.serverID};`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
            
        })

        return true
    }

    static getCurrentGame(db : mysql.Connection, dbName : string, serverID : string | null, gameName : string | null) : Promise<ActiveGame | null>{
        return new Promise((resolve) =>{
            let queryParam

            if(gameName == null){
                queryParam = 'isActive = 1'
            }else{
                queryParam = `GameName = '${gameName}'`
            }

            db.query(`SELECT * FROM ${dbName}.ActiveGames WHERE ${queryParam} AND SERV_ID = '${serverID}';`, (err, res) =>  {
                if(err || res.length != 1){
                    return resolve(null)
                } 
                
                return resolve(new ActiveGame(res[0].SERV_ID,
                                            res[0].GameName,
                                            res[0].GameType,
                                            res[0].DM,
                                            res[0].isActive,
                                            res[0].DefaultRoll,
                                            res[0].Round,
                                            res[0].Turn,
                                            res[0].HideHP,
                                            res[0].ChannelID,
                                            res[0].MessageID))
            })
        })
    }

}
