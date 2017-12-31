const express = require('express');
const path = require('path');
const compression = require('compression');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);



const userApi = require('./api/authentication');
const User = require('./models/User');
const app = express();

const port = process.env.PORT || 8080;
app.use(express.static(__dirname + '/dist'));

dotenv.load({ path: '.env.example' });

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true,
    clear_interval: 3600
  })
}));
app.use(passport.initialize());
app.use(passport.session());



app.use('/api/user', userApi);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/dist/index.html'));
});



app.listen(port, () => {
  console.log('Listening on port ' + port);
});