const appConfig = require('../../config.js');
const crypto = require('crypto');
const express = require('express');
const dateTime=require('node-datetime');
const dateFormat = require('dateformat');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const router = express.Router();

const _ = require('lodash');
const bitInt = require('big-integer');
const ursa = require('ursa');

const HASH_ALGORITHM = 'sha256';

let generateKey = function () {
    // Same as openssl genrsa -out key-name.pem <modulusBits>
    return ursa.generatePrivateKey(1024, 65537);
};

let hash = function (data) {
    let hash = crypto.createHash(HASH_ALGORITHM);
    hash.update(data);
    return hash.digest();
};

const mailgun = require('mailgun-js')({
  apiKey: appConfig.mailgun.apiKey,
  domain: appConfig.mailgun.domain,
});

const passport = require('passport');

const User=require('../models/User');
require('../mongo').connect();

router.get('/checksession', (req, res) => {
  if (req.user) {
    return res.send(JSON.stringify(req.user));
  }
  return res.send(JSON.stringify({}));
});

// GET to /logout
router.get('/logout', (req, res) => {
  req.logout();
  return res.send(JSON.stringify(req.user));
});


router.post('/login', async (req, res) => {
  const query = User.findOne({ email: req.body.email });
  const foundUser = await query.exec();

  // if they exist, they'll have a username, so add that to our body
  if (foundUser) { req.body.username = foundUser.username; }

  passport.authenticate('local')(req, res, () => {
    // If logged in, we should have user info to send back
    if (req.user) {
      return res.send(JSON.stringify(req.user));
    }
    return res.send(JSON.stringify({ error: 'There was an error logging in' }));
  });
});

router.post('/register', async (req, res) => {

  const query = User.findOne({ email: req.body.email });
  const foundUser = await query.exec();

  if (foundUser) { return res.send(JSON.stringify({ error: 'Email or username already exists' })); }
  // Create a user object to save, using values from incoming JSON
  if (!foundUser) {
    // sanitize data
    const window = (new JSDOM('')).window;
    const DOMPurify = createDOMPurify(window);
    let privateKey = generateKey();
    let publicKey = privateKey.toPublicPem();
    const sanitizedBody = {
      username: DOMPurify.sanitize(req.body.username),
      email: DOMPurify.sanitize(req.body.email),
      password: req.body.password,
      privatekey:privateKey.toPrivatePem('hex'),
      publickey:publicKey.toString('hex'),
      address:hash(publicKey).toString('hex'),
      kcoin_available_balances:0,
      kcoin_actual_balance:0

    };

    const newUser = new User(sanitizedBody);

    // Save, via Passport's "register" method, the user
    return User.register(newUser, req.body.password, (err) => {
      // If there's a problem, send back a JSON object with the error
      if (err) {
        return res.send(JSON.stringify({ error: err.message }));
      }
      // Otherwise log them in
      return passport.authenticate('local')(req, res, () => {
        // If logged in, we should have user info to send back
        if (req.user) {
          return res.send(JSON.stringify(req.user));
        }
        // Otherwise return an error
        return res.send(JSON.stringify({ error: 'There was an error registering the user' }));
      });
    });
  }

  // return an error if all else fails
  return res.send(JSON.stringify({ error: 'There was an error registering the user' }));
});


router.post('/savepassword', async (req, res) => {
  let result;
  try {
    // look up user in the DB based on reset hash
    const query = User.findOne({ passwordReset: req.body.hash });
    const foundUser = await query.exec();

    // If the user exists save their new password
    if (foundUser) {
      // user passport's built-in password set method
      foundUser.setPassword(req.body.password, (err) => {
        if (err) {
          result = res.send(JSON.stringify({ error: 'Password could not be saved. Please try again' }));
        } else {
          // once the password's set, save the user object
          foundUser.save((error) => {
            if (error) {
              result = res.send(JSON.stringify({ error: 'Password could not be saved. Please try again' }));
            } else {
              // Send a success message
              result = res.send(JSON.stringify({ success: true }));
            }
          });
        }
      });
    } else {
      result = res.send(JSON.stringify({ error: 'Reset hash not found in database.' }));
    }
  } catch (err) {
    result = res.send(JSON.stringify({ error: 'There was an error connecting to the database.' }));
  }
  return result;
});

// POST to saveresethash
router.post('/saveresethash', async (req, res) => {
  let result;
  try {
    // check and make sure the email exists
    const query = User.findOne({ email: req.body.email });
    const foundUser = await query.exec();

    // If the user exists, save their password hash
    const timeInMs = Date.now();
    const hashString = `${req.body.email}${timeInMs}`;
    const secret = appConfig.crypto.secret;
    const hash = crypto.createHmac('sha256', secret)
                       .update(hashString)
                       .digest('hex');
    foundUser.passwordReset = hash;

    foundUser.save((err) => {
      if (err) { result = res.send(JSON.stringify({ error: 'Something went wrong while attempting to reset your password. Please Try again' })); }
       const emailData = {
        from: `CloseBrace <postmaster@${appConfig.mailgun.domain}>`,
        to: foundUser.email,
        subject: 'Reset Your Password',
        text: `A password reset has been requested for the MusicList account connected to this email address. If you made this request, please click the following link: https://localhost:8080/change-password/${foundUser.passwordReset} ... if you didn't make this request, feel free to ignore it!`,
        html: `<p>A password reset has been requested for the MusicList account connected to this email address. If you made this request, please click the following link: <a href="localhost:8080/change-password/${foundUser.passwordReset}" target="_blank">localhost:8080/change-password/${foundUser.passwordReset}</a>.</p><p>If you didn't make this request, feel free to ignore it!</p>`,
      };

      // Send it
      mailgun.messages().send(emailData, (error, body) => {
        if (error || !body) {
          result = res.send(JSON.stringify({ error: 'Something went wrong while attempting to send the email. Please try again.' }));
        } else {
          result = res.send(JSON.stringify({ success: true }));
        }
      });
    });
  } catch (err) {
    // if the user doesn't exist, error out
    result = res.send(JSON.stringify({ error: 'Something went wrong while attempting to reset your password. Please Try again' }));
  }
  return result;
});

module.exports = router;