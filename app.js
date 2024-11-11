require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./config/mongodb');
const indexRouter = require('./routes/index');
const ownerRouter = require('./routes/owner');
const instituteRouter = require('./routes/institute');
const studentRouter = require('./routes/student');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

// Connect to MongoDB
connectDB();

// Enable helmet for basic security
app.use(helmet());

// CORS Configuration: Allow requests from localhost in development and your production URL
const corsOptions = {
  origin: ['http://localhost:3000', 'https://your-react-app-url.com'], // Add both development and production URLs here
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allows cookies to be sent
};

app.use(cors(corsOptions));

// Configure session
app.use(session({
  secret: process.env.EXPRESS_SECRET,  
  resave: false,
  saveUninitialized: true,
}));

// Set up view engine (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route Handlers
app.use('/', indexRouter);
app.use('/owner', ownerRouter);
app.use('/institute', instituteRouter);
app.use('/student', studentRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
