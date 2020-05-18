var express = require('express');
var router = express.Router();
var CryptoBlock = require('../public/models/block.js');
var CryptoBlockchain = require('../public/models/chain.js');
const { check, validationResult } = require('express-validator');
var voteDb = require('../public/models/mongo.js');
const SHA256 = require('crypto-js/sha256');

const BlockChain = new CryptoBlockchain();

router.post('/create/:id', async function(req, res, next) {
  let database = null;
  return voteDb.open()
  .then((db)=>{
      database = db;
      return db.db('vote').collections(undefined, function (err, cols) {
        if (err) {
          res.status(500).send();
        }
        if (cols.filter(e => e.collectionName === req.params.id).length > 0) {
          return res.status(400).json({Error: 'Blockchain already exists'});
        } else {
          db.db('vote').createCollection(req.params.id, undefined, function(err, col) {
            if (err) {
              res.status(500).send();
            }
            db.db('vote').collection(col.collectionName).insertOne(new CryptoBlock(0, new Date(), 'Genesis block'), undefined, function(err, suc) {
              database.close();
              res.status(201).send();
            });
          })
        }
      });
  })
  .catch((err)=>{
    res.status(500).send()
  })
})

router.get('/:id/block/latest', async function(req, res, next) {
  voteDb.collectionName = req.params.id;
  const latestBlock = await BlockChain.obtainLatestBlock();
  res.json(latestBlock);
})

router.post('/:id/validate', async function(req, res, next) {
  voteDb.collectionName = req.params.id;
  await BlockChain.checkChainValidity().then(e => {
    res.send();
  }).catch(err => {
    res.status(422)
    res.send('The blockchain is invalid');
  });
});

router.post('/:id/block/register', [
  check('pollId').isLength({min: 1}),
  check('choiceId').isLength({min: 1}),
], async function(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).send();
  } else {
    voteDb.collectionName = req.params.id;
    await BlockChain.addNewBlock(new CryptoBlock(0, new Date(), req.body));
    res.status(201);
    res.send();
  }
  
})

router.get('/:id/results', async function(req, res, next) {
  voteDb.collectionName = req.params.id;
  await BlockChain.getAllResults().then(e => {
    res.send(e);
  }).catch(err => {
    console.log(err);
    res.status(500);
    res.send();
  });
});

router.get('/error', function(req, res, next) {
  process.exit();
})

module.exports = router;
