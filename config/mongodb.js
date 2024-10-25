const mongoose = require('mongoose');


const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI).then(()=>{
            console.log('Connected To Database') 
        }).catch((err)=>{
            console.log(err)
        })
    }
    catch(err){
        console.log(err)
    }
}

module.exports = connectDB;