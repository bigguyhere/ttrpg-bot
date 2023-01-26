import mysql, { Connection } from 'mysql'

module DatabaseFunctions{
    export function connect(host : string | undefined, un : string | undefined, 
        pw : string | undefined, dbName : string | undefined) : Connection {
        const gamedb = mysql.createConnection({
            host: host,
            user: un,
            password: pw,
            database: dbName,
            charset : 'utf8mb4',
            multipleStatements: true
        })
        
        gamedb.connect( (err) => {
            if(err){
                console.log(`Issue Connecting to MYSQL Database. ${err}`)
                throw err
            }
        })

        return gamedb
    }

    export function disconnect(gamedb : Connection) {
        gamedb.end( (err) => {
            if(err){
                console.log(`Issue disconnecting from MYSQL Database. ${err}`)
                throw err
            }
        })
    }
}

export {DatabaseFunctions}