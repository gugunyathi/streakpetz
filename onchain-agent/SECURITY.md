# 🔒 Security Guidelines for StreakPets

## ⚠️ Critical Security Rules

### 1. Environment Variables Protection

**NEVER commit sensitive keys to version control!**

```bash
# ✅ GOOD - These files are protected
.env
.env.local
.env.production
.env.*.local

# ❌ BAD - Never create these
.env.committed
secrets.txt
keys.json
```

**Protected by `.gitignore`:**
- All `.env*` files are automatically ignored
- `wallet_data.txt` is ignored
- Never remove these entries from `.gitignore`

### 2. API Key Security

#### OpenAI API Key
```env
# ✅ CORRECT - Server-side only
OPENAI_API_KEY=sk-proj-xxxxx

# ❌ WRONG - Never use NEXT_PUBLIC_ prefix for secrets!
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-xxxxx  # This exposes to client!
```

**Rules:**
- ✅ Use `OPENAI_API_KEY` (server-side only)
- ❌ Never use `NEXT_PUBLIC_OPENAI_API_KEY`
- ✅ Access only in API routes or server components
- ❌ Never import in client components

#### Safe vs Unsafe Environment Variables

```typescript
// ✅ SAFE - Client-side public values
NEXT_PUBLIC_APP_NAME=StreakPets
NEXT_PUBLIC_NETWORK_ID=base-sepolia

// ❌ UNSAFE - Server-side secrets
OPENAI_API_KEY=sk-proj-...
CDP_API_KEY_SECRET=...
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=...
```

### 3. Code Security Checks

#### ✅ Correct Usage (Server-Side)

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai';

export async function POST(req: Request) {
  // ✅ Server-side API route - Safe
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  const response = await client.chat.completions.create({...});
  return Response.json(response);
}
```

```typescript
// lib/openai.ts
// ✅ Server-side library - Safe
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

#### ❌ Incorrect Usage (Client-Side)

```typescript
// components/ChatBox.tsx
'use client';  // ❌ Client component!

import OpenAI from 'openai';

export default function ChatBox() {
  // ❌ NEVER DO THIS - Exposes API key to browser!
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY  // Visible in browser!
  });
  
  // ❌ Client-side API calls expose your key
  const response = await client.chat.completions.create({...});
}
```

**Fix:** Always call OpenAI from API routes:

```typescript
// components/ChatBox.tsx
'use client';

export default function ChatBox() {
  // ✅ CORRECT - Call your API route
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: 'Hello' })
  });
}
```

### 4. Deployment Security

#### Vercel Deployment

```bash
# 1. Add environment variables in Vercel Dashboard
# Settings → Environment Variables

# 2. Never commit .env.production
# 3. Use different keys per environment:
#    - Development: .env.local
#    - Staging: Vercel staging env vars
#    - Production: Vercel production env vars
```

#### Environment Variable Checklist

Before deploying:

- [ ] All `.env*` files in `.gitignore`
- [ ] No API keys in source code
- [ ] No API keys in git history
- [ ] Different keys for dev/staging/prod
- [ ] Keys added to hosting platform
- [ ] `NEXTAUTH_SECRET` is unique and random
- [ ] No `NEXT_PUBLIC_` prefix on secrets

### 5. Git Safety

#### Check Before Committing

```bash
# Check what you're committing
git status
git diff

# Verify .env files are NOT staged
git ls-files | grep .env
# Should return NOTHING

# Check git history for leaked secrets
git log --all --full-history --source --grep="OPENAI_API_KEY"
```

#### If You Accidentally Committed Secrets

```bash
# 1. IMMEDIATELY rotate the compromised keys
# - OpenAI: platform.openai.com/api-keys
# - CDP: portal.cdp.coinbase.com
# - MongoDB: Change password in Atlas

# 2. Remove from git history (complex, get help!)
# Consider using tools like:
git filter-branch  # or
BFG Repo-Cleaner

# 3. Force push (⚠️ dangerous)
git push --force

# 4. Notify team if shared repository
```

### 6. API Key Rotation Schedule

| Service | Rotation Frequency | Action |
|---------|-------------------|--------|
| OpenAI | Every 90 days | Create new key, update env, delete old |
| CDP Keys | Every 90 days | Generate new, update env, revoke old |
| MongoDB | Every 90 days | Change password in Atlas |
| NextAuth Secret | Every 90 days | Generate new random string |
| Twilio | Every 90 days | Rotate auth token |

```bash
# Generate new NextAuth secret
openssl rand -base64 32

# Generate new random secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 7. Security Monitoring

#### What to Monitor

```typescript
// app/api/middleware.ts
// Add request logging
export function middleware(req: Request) {
  console.log({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.headers.get('x-forwarded-for')
  });
}

// Log failed authentication attempts
// Log unusual API usage patterns
// Set up rate limiting
```

#### Rate Limiting (Planned)

```typescript
// Prevent API abuse
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
```

### 8. Production Security Checklist

Before going to mainnet:

- [ ] Security audit completed
- [ ] All secrets rotated
- [ ] Rate limiting implemented
- [ ] Request validation added
- [ ] CORS configured properly
- [ ] HTTPS enforced
- [ ] Database backups automated
- [ ] Error messages sanitized (no sensitive info)
- [ ] Logging system in place
- [ ] Monitoring alerts configured
- [ ] Incident response plan documented

### 9. Dependencies Security

```bash
# Regular security audits
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### 10. Emergency Response

#### If API Key is Compromised:

1. **Immediately** revoke/delete the key
2. Generate new key
3. Update environment variables
4. Deploy new version
5. Monitor usage for suspicious activity
6. Document incident
7. Review how it was exposed
8. Implement preventive measures

#### Emergency Contacts:
- OpenAI: help@openai.com
- Coinbase CDP: support@coinbase.com
- MongoDB: support@mongodb.com

---

## 📚 Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#security)
- [OpenAI API Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [Vercel Security](https://vercel.com/docs/security)

---

## ⚠️ Remember

**Security is not a one-time task - it's an ongoing process!**

- Review access logs regularly
- Rotate keys on schedule
- Keep dependencies updated
- Monitor for suspicious activity
- Train team on security practices
- Have incident response plan ready

**When in doubt, assume it's not secure. Ask for review!**
