const multer = require('multer');
const FirebaseStorage = require('multer-firebase-storage');
const fbAdmin = require('./firebase-config')
const serviceCredentials = require(process.env.FIREBASE_CREDENTIALS_PATH)


const storage = FirebaseStorage({
    bucketName: process.env.FIREBASE_STORAGE_BUCKET,
    credentials: fbAdmin.credential.cert(serviceCredentials),
    unique: true,
    public: true,
})

const upload = multer({
    storage: storage
})

module.exports = upload;