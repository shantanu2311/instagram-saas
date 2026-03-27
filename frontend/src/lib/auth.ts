import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
// import Instagram from "next-auth/providers/instagram";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Connect to Prisma DB for real user lookup
        // const user = await prisma.user.findUnique({
        //   where: { email: credentials.email },
        // });
        // if (!user || !await bcrypt.compare(credentials.password, user.password)) {
        //   return null;
        // }
        // return { id: user.id, name: user.name, email: user.email };

        // Stub: Accept any email/password for development
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        // Return a stub user for development
        return {
          id: "stub-user-id",
          name: "Dev User",
          email,
        };
      },
    }),

    // Instagram OAuth — uncomment when ready
    // Requires INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET in .env
    // Instagram({
    //   clientId: process.env.INSTAGRAM_CLIENT_ID,
    //   clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    // }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
