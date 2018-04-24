import mongoose, { Schema } from 'mongoose'

const notesSchema = new Schema({
  people: {
    type: String
  },
  title: {
    type: String
  },
  content: {
    type: String
  },
  image: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

notesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      people: this.people,
      title: this.title,
      content: this.content,
      image: this.image,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('Notes', notesSchema)

export const schema = model.schema
export default model
