import type {SanityCodegenConfig} from 'sanity-codegen'

// Generates TypeScript types from the Sanity schemas in ../studio/schemas.
// Run with:  npx sanity-codegen --babelOptions '{"presets":["@babel/preset-typescript"]}'
//
// The output replaces the hand-written types in lib/sanity.ts. Until a Sanity
// project exists, the hand-written types in lib/sanity.ts are the source of
// truth — re-run codegen after schema changes once the project is live.
const config: SanityCodegenConfig = {
  schemaPath: '../studio/schemas/index.ts',
  outputPath: './lib/sanity-schema.generated.ts',
  babelOptions: {
    presets: ['@babel/preset-typescript'],
  },
}

export default config
