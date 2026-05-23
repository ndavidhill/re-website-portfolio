import {getCliClient} from 'sanity/cli'

// Alphabetical (case-insensitive) order. ActionAid uses the pre-existing doc id
// (it carries the actionaid.org.au URL); the rest use the seeded slug ids.
const ids = [
  '9aa54ea6-38d7-411f-bf2c-4ca8b3f17587', // ActionAid
  'client-amplar-health',
  'client-anz',
  'client-ayo',
  'client-baptistcare',
  'client-big-w',
  'client-clarivate',
  'client-commonwealth-bank',
  'client-d-and-ad',
  'client-domain',
  'client-everyday-rewards',
  'client-ignition',
  'client-imagine-learning',
  'client-k12',
  'client-kit',
  'client-manchester-united',
  'client-maurice-blackburn',
  'client-mcgrath-foundation',
  'client-medibank',
  'client-minderoo-foundation',
  'client-myob',
  'client-new-zealand-rugby',
  'client-optus',
  'client-smart',
  'client-swisscom',
  'client-sydney-design-festival',
  'client-sydney-festival',
  'client-tourism-australia',
  'client-uniting',
  'client-weel',
  'client-woolworths',
  'client-youi',
]

const clients = ids.map((ref) => ({_type: 'reference', _ref: ref, _key: ref.replace(/[^a-z0-9]/gi, '')}))

const client = getCliClient({apiVersion: '2025-05-01'})
const res = await client.patch('homePage').set({clients}).commit()
console.log(`Set homePage.clients to ${clients.length} refs (rev ${res._rev})`)
