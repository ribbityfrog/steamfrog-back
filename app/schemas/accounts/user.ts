import { z } from 'zod'

const userSchema = z
  .object({
    email: z.string().email(),
  })
  .strict()
export default userSchema

export type UserSchema = z.infer<typeof userSchema>
