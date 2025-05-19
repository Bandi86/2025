import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import bcrypt from 'bcrypt'
import prisma from './client'

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { username } })
      if (!user) return done(null, false, { message: 'Incorrect username.' })
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) return done(null, false, { message: 'Incorrect password.' })
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  })
)

passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: String(id) } })
    done(null, user)
  } catch (err) {
    done(err)
  }
})

export default passport
