/**
 * Module dependencies.
 */
var util = require('util'),
  OAuth2Strategy = require('passport-oauth2');

/**
 * `Strategy` constructor.
 *
 * https://notify-bot.line.me/doc/en/
 * The LINE authentication strategy authenticates requests by delegating to
 * LINE using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `channelID`      your LINE channel's id
 *   - `clientSecret`   your LINE channel's secret
 *   - `callbackURL`   URL to which LINE will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new LineStrategy({
 *         channelID: 'XXX',
 *         clientSecret: 'XXXX'
 *         callbackURL: 'https://www.example.net/auth/line/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  if (options.state === false) {
    throw new Error(
      'options.state === false is not supported since LINE Login v2'
    );
  }

  options = options || {};

  // Default options.state to true (Now required by LINE v2)
  // passport-oauth handles this and generates a unique state identification for the request
  // This identification is then saved in Session (by default) and compared when response arrives
  // NOTE: that now this requires you to use express-session (or a similar) session plugin
  // Optionally you can use your own state store. See passport-oauth2 for more information.
  options.state = options.state || true;

  options.clientID = options.channelID;
  options.clientSecret = options.channelSecret;
  options.authorizationURL =
    options.authorizationURL || 'https://notify-bot.line.me/oauth/authorize';
  options.tokenURL =
    options.tokenURL || 'https://notify-bot.line.me/oauth/token';

  // accroding to LINE Notify document, scope should be fixed value 'notify'
  if (options.scope) console.error('scope should be fixed value "notify“');
  else options.scope = 'notify';

  OAuth2Strategy.call(this, options, verify);

  this.name = 'line_notify';

  // Use Authorization Header (Bearer with Access Token) for GET requests. Used to get User's profile.
  this._oauth2.useAuthorizationHeaderforGET(true);
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
