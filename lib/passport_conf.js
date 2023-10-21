const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');


/* const customFields = {
    usernameField: 'uname',
    passwordField: 'pw'
};
const strategy  = new LocalStrategy(customFields, verifyCallback); */

// Configure the local strategy for use by Passport.
passport.use(
    new LocalStrategy(async function(username, password, done) {
      try{
        const user = await User.findOne({ username: username }).exec();
        //console.log("From Strategy");
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.validatePassword(password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
);

// Configure Passport authenticated session persistence.
passport.serializeUser( function(user, done) {
  done(null, user._id);
});
  
passport.deserializeUser(async function(id, done) {
      try{
        const user = await User.findById(id).exec();
        console.log("From deserialize");
        return done(null, user);
      } catch(err) {
        return done(err);
      } 
});