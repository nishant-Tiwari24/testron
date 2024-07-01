import prisma from "@/lib/prisma";
import NextAuth from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'email', type: 'text', placeholder: '' },
        password: { label: 'password', type: 'password', placeholder: '' },
      },
      //@ts-ignore
      async authorize(credentials: any) {
        if (!credentials?.username || !credentials.password) {
          console.error("Credentials are undefined");
          return null;
        }

        const user = await prisma.user.findFirst({
          where: { email: credentials.username },
        });

        if (!user) {
          console.error("No user found with the given email");
          return null;
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          console.error("Invalid password");
          return null;
        }

        console.log("User ID:", user.id);
        return { id: user.id, email: user.email };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt: async ({ user, token }: any) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    session: ({ session, token }: any) => {
      if (session.user) {
        session.user.id = token.uid;
        session.user.token = token;
      }
      return session;
    },
  },
};
//@ts-ignore
const handler = (req: NextRequest, res: NextResponse) => NextAuth(req, res, authOptions);

export const GET = handler;
export const POST = handler;
