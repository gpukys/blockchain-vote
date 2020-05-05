var mongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:<password>@cluster0-f1kav.mongodb.net/test?retryWrites=true&w=majority";

function open(){
  // Connection URL. This is where your mongodb server is running.
  return new Promise((resolve, reject)=>{
    // Use connect method to connect to the Server
    mongoClient.connect(uri, (err, db) => {
        if (err) {
            reject(err);
        } else {
            resolve(db);
        }
    });
  });
}

function close(db){
  //Close connection
  if(db){
      db.close();
  }
}

let db = {
  open : open,
  close: close
}

module.exports = db;