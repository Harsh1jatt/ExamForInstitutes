require('dotenv').config();
const express = require('express')
const app = express();
const connectDB = require('./config/mongodb')
const indexRouter = require('./routes/index')
const ownerRouter = require('./routes/owner')
const instituteRouter = require('./routes/institute')
const studentRouter = require('./routes/student')
const session = require('express-session');
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')



connectDB()
app.use(helmet())
app.use(cors())
// Configure session
app.use(session({
    secret: process.env.EXPRESS_SECRET,  
    resave: false,
    saveUninitialized: true,
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/', indexRouter)
app.use('/owner', ownerRouter)
app.use('/institute', instituteRouter)
app.use('/student', studentRouter)


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
