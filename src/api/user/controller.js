import { success, notFound } from '../../services/response/'
import { User } from '.'
import { sign } from '../../services/jwt'
import Image from '../../services/image'

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  User.count(query)
    .then(count => User.find(query, select, cursor)
      .then(users => ({
        rows: users.map((user) => user.view()),
        count
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  User.findById(params.id)

    .then(notFound(res))
    .then((user) => user ? user.view(true) : null)
    .then(success(res))
    .catch(next)

export const showMe = ({ user }, res) =>
  res.json(user.view(true))

export const create = ({ bodymen: { body } }, res, next) => {
  User.create(body)
    .then(user => {
      console.log(user.view(true));
      sign(user.id)
        .then((token) => ({ token, user: user.view(true)}))
        .then(success(res, 201))
    })
    .catch((err) => {
      /* istanbul ignore else */
      if (err.name === 'MongoError' && err.code === 11000) {
        res.status(409).json({
          valid: false,
          param: 'email',
          message: 'email already registered'
        })
      } else {
        next(err)
      }
    })
}

export const update = ({ bodymen: { body }, params, user }, res, next) =>
  User.findById(params.id === 'me' ? user.id : params.id)
    .then(notFound(res))
    .then((result) => {
      if (!result) return null
      const isAdmin = user.role === 'admin'
      const isSelfUpdate = user.id === result.id
      if (!isSelfUpdate && !isAdmin) {
        res.status(401).json({
          valid: false,
          message: 'You can\'t change other user\'s data'
        })
        return null
      }
      return result
    })
    .then((user) => user ? Object.assign(user, body).save() : null)
    .then((user) => user ? user.view(true) : null)
    .then(success(res))
    .catch(next)

export const updatePassword = ({ bodymen: { body }, params, user }, res, next) =>
  User.findById(params.id === 'me' ? user.id : params.id)
    .then(notFound(res))
    .then((result) => {
      if (!result) return null
      const isSelfUpdate = user.id === result.id
      if (!isSelfUpdate) {
        res.status(401).json({
          valid: false,
          param: 'password',
          message: 'You can\'t change other user\'s password'
        })
        return null
      }
      return result
    })
    .then((user) => user ? user.set({ password: body.password }).save() : null)
    .then((user) => user ? user.view(true) : null)
    .then(success(res))
    .catch(next)

const removeCurrentPhotos = (initiative) => {
  const sizes = Object.keys(initiative.photo.toObject())
  const promises = []
  if (sizes.length) {
    // istanbul ignore next
    promises.push(sizes.map((size) => s3.remove(initiative.photo[size])))
  }
  return Promise.all(promises)
}

const uploadResizedPhotos = (image) => {
  const uniqueId = uid(24)
  const getFileName = (size) => `${uniqueId}_${size}.jpg`
  const sizes = {
    large: [1024, 768],
    medium: [640, 480],
    small: [320, 240]
  }
  const promises = Object.keys(sizes).reduce((object, size) => {
    object[size] = image.clone().quality(80).scaleToFit(...sizes[size]).getBuffer()
    return object
  }, {})
  return Promise.props(promises).then((buffers) =>
    Promise.props(
      Object.keys(buffers).reduce((object, size) => {
        object[size] = s3.upload(buffers[size], getFileName(size), 'image/jpeg')
        return object
      }, {})
    )
  )
}


export const updatePhoto = ({ user, params, file }, res, next) =>
  Initiative.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'user'))
    .then((initiative) => {
      if (!initiative) return null
      removeCurrentPhotos(initiative)
      return Image.read(file.buffer).then((image) => {
        initiative.color = image.getPredominantColorHex()
        return uploadResizedPhotos(image)
      }).then((photo) => {
        initiative.photo = photo
        return initiative.save()
      })
    })
    .then((initiative) => initiative ? initiative.view() : null)
    .then(success(res))
    .catch(next)


export const destroy = ({ params }, res, next) =>
  User.findById(params.id)
    .then(notFound(res))
    .then((user) => user ? user.remove() : null)
    .then(success(res, 204))
    .catch(next)
