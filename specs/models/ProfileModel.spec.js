import ProfileModel, {validate} from '../../src/models/ProfileModel'

const model = new ProfileModel({
  name: 'John',
  email: 'john@chronobank.io',
  company: 'ChronoBank'
})

describe('user model', () => {
  it('should validate', () => {
    const values = new Map()
    values.set('name', model.name())
    values.set('email', model.email())
    values.set('company', model.company())
    expect(validate(values)).toEqual({
      name: null,
      email: null,
      company: null
    })
  })
})
