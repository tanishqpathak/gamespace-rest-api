const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/users');
const bcrypt = require('bcryptjs');
const config = require('../config/database')

module.exports = (passport) => {
  // Local Strategy
  passport.use(new LocalStrategy(function (username, password, done) {
    // Match Username
    let query = { username: username };
    User.findOne(query, (err, user) => {
      if (err) throw err;
      if (!user) {
        return done(null, false, { message: 'No user found !' });
      }

      // Match Password
      bcrypt.compare(password, user.password,  (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Wrong password !' });
        }
      });
    });
  }));

  passport.serializeUser( (user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser( (id, done) => {
    User.findById(id,  (err, user) => {
      done(err, user);
    });
  });
}
