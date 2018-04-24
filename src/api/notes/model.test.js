import { Notes } from '.'

let notes

beforeEach(async () => {
  notes = await Notes.create({ people: 'test', title: 'test', content: 'test', image: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = notes.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(notes.id)
    expect(view.people).toBe(notes.people)
    expect(view.title).toBe(notes.title)
    expect(view.content).toBe(notes.content)
    expect(view.image).toBe(notes.image)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = notes.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(notes.id)
    expect(view.people).toBe(notes.people)
    expect(view.title).toBe(notes.title)
    expect(view.content).toBe(notes.content)
    expect(view.image).toBe(notes.image)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
