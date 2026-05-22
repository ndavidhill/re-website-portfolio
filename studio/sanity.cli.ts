import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '',
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  // Hosted Studio target — `sanity deploy` uses this and skips the hostname
  // prompt. Live at https://redesign.sanity.studio
  studioHost: 'redesign',
  autoUpdates: true,
})
