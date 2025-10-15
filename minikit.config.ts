const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjEwNDEzMjQsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgyMjY3MTBkMTNFNmMxNmYxYzk5RjM0NjQ5NTI2YkQzYkYxN2NkMDEwIn0",
    payload: "eyJkb21haW4iOiJzdHJlYWtwZXR6LnZlcmNlbC5hcHAifQ",
    signature: "MHgwMDcxOWU2ODgxMzJmODFlOWFiMzg0OWZkNGI2YWQ2MjhlYTg2NGJiYTkzYjQzNmUzMjA2MDEzNjI2NWQ5ZTVjMDg2MWM2Nzc4MGY4ODJlNDFmYWMxYTEyNTAwOTUwMDM2YzU1ODQ2Yjk4ZjFiNGRlNzExYTkyOWRkMTE4YWUxZDFj"
  },
  baseBuilder: {
    allowedAddresses: ["0x60Dda656c7fa2065089d2409ee70Ffeb877D363C"]
  },
  miniapp: {
    version: "1",
    name: "Cubey", 
    subtitle: "Your AI Ad Companion", 
    description: "Ads",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["marketing", "ads", "quickstart", "waitlist"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`, 
    tagline: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;

