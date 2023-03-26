import passport from 'koa-passport';
import LineNotifyStrategy from './lib/passport-line-notify';
import Router from 'koa-router';
import url from 'url';
import UserSettings from 'src/database/models/userSettings';

/**
 * Serialize to session
 */
passport.serializeUser((_, done) => {
  done(null, _);
});

/**
 * De-serialize and populates ctx.state.user
 */
passport.deserializeUser(async (_, done) => {
  done(null, _);
});

if (process.env.LINE_NOTIFY_CLIENT_ID) {
  passport.use(
    new LineNotifyStrategy(
      {
        channelID: process.env.LINE_NOTIFY_CLIENT_ID,
        channelSecret: process.env.LINE_NOTIFY_CLIENT_SECRET,
        callbackURL:
          process.env.RUMORS_LINE_BOT_URL + '/authcallback/line_notify',
      }, // LINE Notify does not provide refreshToken and profile
      (accessToken, refreshToken, profile, done) => {
        // console.log('accseeToken:' + accessToken);
        // no need to verifyProfile, just return accessToken
        // done(err, user, info)
        return done(null, accessToken);
      }
    )
  );
}

// Exports route handlers
//
export const loginRouter = Router()
  .use((ctx, next) => {
    // Memorize redirect in session
    //
    if (!ctx.query.redirect || !ctx.query.redirect.startsWith('/')) {
      const err = new Error(
        '`redirect` must present in query string and start with `/`'
      );
      err.status = 400;
      err.expose = true;
      throw err;
    }
    if (!ctx.query.userId) {
      const err = new Error('`userId` must present in query string');
      err.status = 400;
      err.expose = true;
      throw err;
    }
    ctx.session.userId = ctx.query.userId;
    ctx.session.redirect = ctx.query.redirect;

    // execute next middleware (passport.authenticate('line_notify'))
    next();
  })
  .get('/line_notify', passport.authenticate('line_notify'));

const handlePassportCallback = (strategy) => (ctx, next) =>
  passport.authenticate(strategy, (err, accessToken) => {
    if (err) {
      err.status = 401;
      throw err;
    }

    // auth success, write token to db
    // accessToken will be false when user cancel to auth
    if (accessToken) {
      UserSettings.setAllowNewReplyUpdate(ctx.session.userId, true);
      UserSettings.setNewReplyNotifyToken(ctx.session.userId, accessToken);
    }
  })(ctx, next);

export const authRouter = Router()
  .use(async (ctx, next) => {
    // Perform redirect after login
    //
    if (!ctx.session.redirect && !ctx.session.userId) {
      const err = new Error(
        '`userId` and `redirect` must be set before. Did you forget to go to /login/*?'
      );
      err.status = 400;
      err.expose = true;
      throw err;
    }

    // execute next middleware (handlePassportCallback('line_notify'))
    await next();

    ctx.redirect(
      url.resolve(process.env.RUMORS_LINE_BOT_URL, ctx.session.redirect)
    );
    ctx.session.userId = undefined;
    ctx.session.redirect = undefined;
  })
  .get('/line_notify', handlePassportCallback('line_notify'));
