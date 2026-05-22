import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    // Public ids — hardcoded so CLI/build commands always resolve the right
    // project even without a loaded .env. Env vars still override.
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'ju4przbj',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Hosted Studio target — `sanity deploy` uses this and skips the hostname
  // prompt. Globally-unique name ("redesign" was already taken by another org).
  // Live at https://re-design-ndavidhill.sanity.studio
  studioHost: 're-design-ndavidhill',
  autoUpdates: true,
})
