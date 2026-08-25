/**
 * One-off index sync.
 *
 * Production no longer builds indexes on every boot (`autoIndex: false`), because
 * a failed/conflicting build used to crash the API during cold starts. Run this
 * once after changing any schema index:
 *
 *   cd backend && npm run sync-indexes
 */
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

const MODELS_DIR = path.join(__dirname, '..', 'src', 'models')

const main = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Add it to backend/.env first.')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
  })
  console.log('Connected to MongoDB')

  const modelFiles = fs
    .readdirSync(MODELS_DIR)
    .filter((file) => file.endsWith('.js'))

  for (const file of modelFiles) {
    require(path.join(MODELS_DIR, file))
  }

  let failures = 0
  for (const modelName of mongoose.modelNames()) {
    try {
      await mongoose.model(modelName).syncIndexes()
      console.log(`  ok   ${modelName}`)
    } catch (err) {
      failures += 1
      console.error(`  FAIL ${modelName}: ${err.message}`)
    }
  }

  await mongoose.disconnect()
  console.log(
    failures === 0
      ? 'All indexes synced.'
      : `Finished with ${failures} failure(s).`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('Index sync failed:', err)
  process.exit(1)
})
