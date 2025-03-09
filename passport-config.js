if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const LocalStrategy = require("passport-local").Strategy;
function initializePassport(passport, getUserByName, getUserById) {
  const authenticateUser = async (name, password, done) => {
    const user = getUserByName(name);

    if (user == null) {
      return done(null, false, { message: "No user with that email" });
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        const accessToken = generateAccessToken(user);
        return done(null, user, { accessToken: accessToken });
      } else {
        return done(null, false, { message: "Password is incorrect" });
      }
    } catch (error) {
      return done(error);
    }
  };
  passport.use(new LocalStrategy({ usernameField: "name" }, authenticateUser));
  passport.serializeUser((user, done) => {
    return done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id));
  });
}
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,

    { expiresIn: "15m" }
  );
}

module.exports = initializePassport;
