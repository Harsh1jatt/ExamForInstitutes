const express = require('express')
const router = express.Router();



router.get('/', function(req, res){
    res.send('Hello I Am Working')
})

module.exports = router;
