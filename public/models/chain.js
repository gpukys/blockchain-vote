var voteDb = require('./mongo.js');
const SHA256 = require('crypto-js/sha256');


module.exports = class CryptoBlockchain{
  constructor(){ }

  async obtainLatestBlock(){
    let database = null;
    return voteDb.open()
    .then((db)=>{
        database = db;
        return db.db('vote').collection(voteDb.collectionName)    
    })
    .then((vote)=>{
        return vote.findOne({}, {sort:{$natural:-1}});
    })
    .then((result)=>{
        database.close();
        return result;
    })
    .catch((err)=>{
      console.error(err);
    })
  }
  async addNewBlock(newBlock){
      const latest = await this.obtainLatestBlock();
      newBlock.precedingHash = latest.hash;
      newBlock.index = latest.index + 1;
      newBlock.hash = newBlock.computeHash();        
      let database = null;
      return voteDb.open()
      .then((db)=>{
          database = db;
          return db.db('vote').collection(voteDb.collectionName)    
      })
      .then((vote)=>{
          return vote.insertOne(newBlock);
      })
      .then((result)=>{
          database.close();
          return result;
      })
      .catch((err)=>{
        console.error(err);
      })
  }
  async checkChainValidity(){
    let database = null;
    return voteDb.open()
    .then((db)=>{
        database = db;
        return db.db('vote').collection(voteDb.collectionName)    
    })
    .then((vote)=>{
        return vote.find({});
    })
    .then((result)=>{
        function computeHash(block){
          return SHA256(block.index + block.precedingHash + block.timestamp + JSON.stringify(block.data)).toString();
        }
        return new Promise(function(resolve, reject) {
          result.toArray(function(err, block) {
            for (let i = 1; i<block.length; i++) {
              const currentBlock = block[i];
              const precedingBlock = block[i - 1];
      
              if(currentBlock.hash !== computeHash(currentBlock)){
                  reject(false);
              }
              if(currentBlock.precedingHash !== precedingBlock.hash) {
                reject(false);
              }
            }
            resolve(true);
          })
        })
    }).then((boom)=>{
      console.log('res', boom);
      database.close();
      return boom;
    }).catch(err => {
      reject(false);
    })
}
}