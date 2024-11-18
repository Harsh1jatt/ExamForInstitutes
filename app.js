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

// Allow requests from any domain with CORS
app.use(cors({
  origin: '*', // Allow all domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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

// Default route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
