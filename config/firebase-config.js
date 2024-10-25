const fbAdmin = require('firebase-admin')
const serviceCredentials = require(process.env.FIREBASE_CREDENTIALS_PATH)

fbAdmin.initializeApp({
    credential: fbAdmin.credential.cert(serviceCredentials),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
})

module.exports = fbAdmin;