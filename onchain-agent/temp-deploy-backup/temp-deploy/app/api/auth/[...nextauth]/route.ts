import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authenticateWithEmail, authenticateWithPhone } from '@/lib/users'

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    phone?: string;
  }
  
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phone?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    phone?: string;
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Email/Password Authentication
    CredentialsProvider({
      id: 'email',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const result = authenticateWithEmail(credentials.email, credentials.password);
        
        if (result.success && result.user) {
          return {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
          }
        }
        
        return null
      }
    }),
    // Phone/Password Authentication
    CredentialsProvider({
      id: 'phone-password',
      name: 'Phone Password',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          return null
        }

        const result = authenticateWithPhone(credentials.phone, credentials.password);
        
        if (result.success && result.user) {
          return {
            id: result.user.id,
            name: result.user.name,
            phone: result.user.phone,
            email: `${result.user.phone}@phone.auth`,
          }
        }
        
        return null
      }
    }),
    // SMS Verification (existing)
    CredentialsProvider({
      id: 'phone',
      name: 'Phone',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        code: { label: 'Verification Code', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          return null
        }

        // Import SMS verification function
        const { verifyCode } = await import('@/lib/sms');
        
        // Verify the SMS code
        const isValidCode = verifyCode(credentials.phone, credentials.code);
        
        if (isValidCode) {
          return {
            id: `phone_${credentials.phone}`,
            name: `User ${credentials.phone}`,
            email: `${credentials.phone}@phone.auth`,
            phone: credentials.phone,
          }
        }
        
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (token.phone) {
        session.user.phone = token.phone
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
})

export { handler as GET, handler as POST }