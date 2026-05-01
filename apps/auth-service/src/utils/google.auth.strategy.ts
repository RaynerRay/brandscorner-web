import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "@packages/libs/prisma";
import { sendLog } from "@packages/utils/logs/send-logs";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;

        if (!email) {
          return done(new Error("Google account has no email"), undefined);
        }

        let user = await prisma.users.findUnique({ where: { email } });

        if (!user) {
          const userCount = await prisma.users.count();
          user = await prisma.users.create({
            data: {
              name,
              email,
              ...(userCount === 0 && { role: "admin" }),
            },
          });

          sendLog({
            type: "success",
            message: `New user registered via Google: ${email}`,
            source: "auth-service",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

export default passport;
