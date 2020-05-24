const express = require('express');
const bodyParser = require('body-parser');
const NlpjsTFr = require('nlp-js-tools-french');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3019;

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());

var config = {
    tagTypes: ['ver', 'nom'],
    strictness: false,
    minimumLength: 3,
    debug: true
};

var server = app.listen(port, function(){
    console.log(`Listening on port ${port}!`);
});

// --------------------------- INSERT ---------------------------

app.get('/insertWords/:word/:action', function(req, resp){

    let db = new sqlite3.Database('./music.db', (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Connected to the music SQlite database.');
    });

    db.run(`INSERT INTO keywords (word, action) VALUES ('${req.params.word}', '${req.params.action}')`, (err) => {
        if(err){
            throw err;
        }
        resp.send(`A row has been inserted!`);
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
    });
});

app.get('/insertTracks/:name/:artist', function(req, resp){

    let db = new sqlite3.Database('./music.db', (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Connected to the music SQlite database.');
    });

    db.run(`INSERT INTO tracks (name, artist) VALUES ('${req.params.name}', '${req.params.artist}')`, (err) => {
        if(err){
            throw err;
        }
        resp.send(`A row has been inserted!`);
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
    });
});

// --------------------------- SHOW TABLES ---------------------------

app.get('/db/keywords', function(req, resp){

    let db = new sqlite3.Database('./music.db', (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Connected to the music SQlite database.');
    });

    db.all("SELECT * FROM keywords", (err, rows) => {
        if(err){
            throw err;
        }
        rows.forEach((row) => {
            console.log(row);
        });
        resp.send(rows);
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
    });
});

app.get('/db/tracks', function(req, resp){

    let db = new sqlite3.Database('./music.db', (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Connected to the music SQlite database.');
    });

    db.all("SELECT * FROM tracks", (err, rows) => {
       if(err){
           throw err;
       }
       rows.forEach((row) => {
          console.log(row);
       });
       resp.send(rows);
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
    });
});

// // --------------------------- PARSER ---------------------------

app.get('/parse/:msg', function(req, resp){

    var jsonObj = {action: null, track: null};
    var sended = false;
    var itemsProcessed = 0;

    var nlpToolsFr = new NlpjsTFr(req.params.msg, config);
    var lemmatizedWords = nlpToolsFr.lemmatizer();

    let db = new sqlite3.Database('./music.db', (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Connected to the music SQlite database.');
    });

    lemmatizedWords.forEach(obj => {

        db.each(`SELECT * FROM keywords WHERE word LIKE '${obj.lemma}'`, (err, row) => {
            if(err){
                throw err;
            }
            if(jsonObj.action === null){
                jsonObj.action = row.action;
                complete();
            }
        });

        db.each(`SELECT * FROM tracks WHERE name LIKE '%${obj.lemma}%'`, (err, row) => {
            if(err){
                throw err;
            }
            if(jsonObj.track === null){
                jsonObj.track = {
                    name: row.name,
                    artist: row.artist,
                    type: row.type,
                    duration: row.duration,
                    lob: row.lob
                }
                complete();
            }
        });

        itemsProcessed++;

        if(itemsProcessed === lemmatizedWords.length && !sended === false ){
            noResult();
        }

    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
    });

    function complete(){
        if( jsonObj.action !== null && sended === false ){
            if(jsonObj.action === "Play" && jsonObj.track === null){
                console.log('');
            } else {
                sended = true;
                resp.send(jsonObj);
            }
        }
    }

    function noResult(){
        resp.send(null);
    }

});

//Server frontend view
app.use(express.static(__dirname + '/StringParser'));