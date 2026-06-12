import bcrypt from 'bcryptjs';
import { insertProfile, findProfileByEmailWithPassword } from './auth.repository.js';
import { publicUser } from '../support.repository.js';

export async function registerUser(email: string, displayName: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return publicUser(await insertProfile(email, displayName, passwordHash));
}

export async function loginUser(email: string, password: string) {
  const user = await findProfileByEmailWithPassword(email);
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  return valid ? publicUser(user) : null;
}
