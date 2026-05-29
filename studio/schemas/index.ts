import author from './author'
import article from './article'
import caseStudy from './caseStudy'
import client from './client'
import homePage from './homePage'
import playItem from './playItem'
import {portableText} from './blocks/portableText'
import {
  mediaBlock,
  quoteBlock,
  statsBlock,
  galleryBlock,
  videoBlock,
} from './blocks/caseStudyBlocks'

export const schemaTypes = [
  // Singletons
  homePage,
  // Documents
  author,
  article,
  caseStudy,
  client,
  playItem,
  // Shared
  portableText,
  // Case study blocks
  mediaBlock,
  quoteBlock,
  statsBlock,
  galleryBlock,
  videoBlock,
]
