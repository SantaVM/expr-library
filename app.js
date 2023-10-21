const express = require('express');
const path = require('path');
const favicon = require('express-favicon');
//const cookieParser = require('cookie-parser'); // Since version 1.5.0, the cookie-parser middleware no longer needs to be used for "express-session" to work.
const logger = require('morgan');
var compression = require('compression');
var helmet = require('helmet');

// Gives us access to variables set in the .env file via `process.env.VARIABLE_NAME` syntax
require('dotenv').config();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require("./routes/catalog"); //Import routes for "catalog" area of site

const app = express();
app.use(favicon(__dirname + '/public/images/bookmark.ico'));

// Set up mongoose connection
const mongoose = require("mongoose");
const mongoDB = process.env.MONGODB_URI;

const clientPromise = mongoose.connect(
  mongoDB,
  { useNewUrlParser: true, useUnifiedTopology: true }
).then(m => m.connection.getClient()).catch((err) => console.log(err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(cookieParser()); // Note Since version 1.5.0, the cookie-parser middleware no longer needs to be used for "express-session" to work.
app.use(compression()); // Compress all routes
// This sets custom options for the
// Content-Security-Policy header.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "cdn.jsdelivr.net", "code.jquery.com"],
      },
    },
  })
);
app.use(express.static(path.join(__dirname, 'public')));

/**
 * -------------- SESSION SETUP FOR PASSPORT AUTHENTICATION ----------------
 */
const session = require('express-session');
// Storing session in MongoDB for Passport Authentication https://www.npmjs.com/package/connect-mongo
const MongoStore = require('connect-mongo');

app.use(session({
  secret: process.env.SESSION_SECRET,
  name: 'sessionId',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    clientPromise: clientPromise,
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // Equals 1 day
  }
  // cookie: { secure: true }
}));

// Use connect-flash middleware.  This will add a `req.flash()` function to
// all requests,
const flash = require('express-flash');
app.use( flash() );

// Need to require the entire Passport config module so app.js knows about it
require('./lib/passport_conf');

// Initialize Passport and restore authentication state, if any,
// from the session.
const passport = require('passport');
//app.use(passport.initialize());
app.use(passport.session());

// Use our Authentication and Authorization middleware.
const auth = require("./lib/auth");
// Pass isAuthenticated in response.locals.isAuthenticated 
// and current_user in response.locals.current_user
// to all views.
app.use(auth.current_user);
app.use(auth.router);

// app.use((req, res, next) => {
//   console.log(req.session);
//   next();
// });

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/catalog", catalogRouter); // Add catalog routes to middleware chain.

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error( "Not found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
