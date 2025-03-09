const { authenticate } = require("passport");
const bcrypt = require("bcrypt");

const LocalStrategy = require("passport-local").Strategy;
function initializePassport(passport, getUserByName, getUserById) {
  const authenticateUser = async (name, password, done) => {
    const user = getUserByName(name);

    if (user == null) {
      return done(null, false, { message: "No user with that email" });
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Password is incorrect" });
      }
    } catch (error) {
      return done(error);
    }
  };
  passport.use(new LocalStrategy({ usernameField: "name" }, authenticateUser));
  passport.serializeUser((user, done) => {
    console.log(user.id);
    return done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    console.log("user id is: " + id);
    return done(null, getUserById(id));
  });
}

module.exports = initializePassport;
