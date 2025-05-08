import * as bcrypt from 'bcryptjs'
import { ValidationError } from '../../lib/error'

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
  } catch (err: any) {
    throw new ValidationError('Password hashing failed')
  }
}
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash)
  } catch (err: any) {
    throw new ValidationError('Password comparison failed')
  }
}
export const hashPasswordSync = (password: string): string => {
  try {
    const salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(password, salt)
  } catch (err: any) {
    throw new ValidationError('Password hashing failed')
  }
}
export const comparePasswordSync = (password: string, hash: string): boolean => {
  try {
    return bcrypt.compareSync(password, hash)
  } catch (err: any) {
    throw new ValidationError('Password comparison failed')
  }
}

