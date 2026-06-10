import author from './author'
import article from './article'
import caseStudy from './caseStudy'
import client from './client'
import homePage from './homePage'
import infoPage from './infoPage'
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
  infoPage,
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
