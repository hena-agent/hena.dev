/**
 * Single source of truth for site content.
 * Edit this file to update the homepage.
 */

export const site = {
  url: "https://hena.dev",
  name: "Hena",
  bio: "Quietly building on the web.",
  description: "Hena — quietly building on the web.",
  email: "hi@hena.dev",
  links: [
    { label: "GitHub", href: "https://github.com/hena-dev" },
    { label: "X", href: "https://x.com/hena_dev" },
    { label: "Bluesky", href: "https://bsky.app/profile/hena.dev" },
    { label: "Email", href: "mailto:hi@hena.dev" },
  ],
} as const

export type SiteLink = (typeof site.links)[number]
