import { MongoHelper } from '@/external/repositories/mongodb/helpers'
import { UserBuilder, NoteBuilder } from '@test/builders'
import { makeNoteRepository, makeUserRepository, makeEncoder, makeTokenManager } from '@/main/factories'
import app from '@/main/config/app'
import request from 'supertest'

describe('Remove note route', () => {
  let validUser = UserBuilder.aUser().build()
  let aNote = NoteBuilder.aNote().build()
  let token = null

  beforeAll(async () => {
    await MongoHelper.connect(process.env.MONGO_URL)
    await MongoHelper.clearCollection('users')
    await MongoHelper.clearCollection('notes')
    const userRepo = makeUserRepository()
    const noteRepo = makeNoteRepository()
    const encoder = makeEncoder()
    const tokenManager = makeTokenManager()
    validUser = await userRepo.add({
      email: validUser.email,
      password: await encoder.encode(validUser.password)
    })
    aNote = await noteRepo.add({
      title: aNote.title,
      content: aNote.content,
      ownerEmail: validUser.email,
      ownerId: validUser.id
    })
    token = await tokenManager.sign({ id: validUser.id })
  })

  afterAll(async () => {
    await MongoHelper.disconnect()
    await MongoHelper.clearCollection('users')
    await MongoHelper.clearCollection('notes')
  })

  test('should be able to remove existing note for valid user', async () => {
    app.delete('/test_cors', (req, res) => {
      res.send()
    })
    await request(app)
      .delete('/api/notes/' + aNote.id)
      .set('x-access-token', token)
      .send({
        noteId: aNote.id,
        userId: aNote.ownerId
      })
      .expect(200)
  })
})
