import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    // Public ids — hardcoded so CLI/build commands always resolve the right
    // project even without a loaded .env. Env vars still override.
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || '7plawvk9',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Hosted Studio target — `sanity deploy` uses this and skips the hostname
  // prompt. Globally-unique name ("redesign" was already taken by another org).
  // Portfolio copy — separate host from the original re.design Studio.
  studioHost: 're-portfolio-ndavidhill',
  deployment: {
    // appId removed: the original belongs to the re.design Studio. The first
    // `sanity deploy` here assigns a new one — pin it afterwards.
    autoUpdates: true,
  },
})
