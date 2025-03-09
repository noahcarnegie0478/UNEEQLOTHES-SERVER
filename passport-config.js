const { authenticate } = require("passport");
const bcrypt = require("bcrypt");

const LocalStrategy = require("passport-local").Strategy;
function initializePassport(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const user = getUserByEmail(email);
    if (user == null) {
      return done(null, false, { message: "No user with that email" });
    }
    try {
      if (await bcrypt.compare(passord, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Password is incorrect" });
      }
    } catch (error) {
      return done(error);
    }
  };
  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    done(null, getUserById(id));
  });
}

module.exports = initializePassport;
