import { getServerSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import type { Session, User } from 'next-auth';

const googleId = process.env.GOOGLE_ID;
const googleSecret = process.env.GOOGLE_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!googleId || !googleSecret) {
  console.warn('Google OAuth credentials not configured. Auth will not work in production.');
}

if (!nextAuthSecret) {
  console.warn('NEXTAUTH_SECRET is not set.');
}

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: googleId || '',
      clientSecret: googleSecret || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, user }: { session: Session; user: User }) {
      if (session.user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
  trustHost: true,
  secret: nextAuthSecret,
};

// Export auth function for use in Server Actions
export async function auth() {
  return getServerSession(authConfig);
}


