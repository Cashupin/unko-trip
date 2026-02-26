import { getServerSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import type { NextAuthOptions, Session } from 'next-auth';

const googleId = process.env.GOOGLE_ID;
const googleSecret = process.env.GOOGLE_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!googleId || !googleSecret) {
  console.warn('Google OAuth credentials not configured. Auth will not work in production.');
}

if (!nextAuthSecret) {
  console.warn('NEXTAUTH_SECRET is not set.');
}

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // <- ESTO ES CLAVE PARA EL MIDDLEWARE
  },
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
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  secret: nextAuthSecret,
};

// Export auth function for use in Server Actions
export async function auth() {
  return getServerSession(authConfig);
}