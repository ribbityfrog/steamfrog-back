import type { OperationType } from '#models/accounts/types'
import type { OperationKeys } from '#schemas/accounts/operation'
import env from '#start/env'

export default (operationType: OperationType, keys: OperationKeys): string => {
  let link = env.get('FRONT_ORIGIN')

  if (operationType === 'connect') link += env.get('MAGIC_CONNECT')
  else if (operationType === 'newEmail') link += env.get('MAGIC_NEWEMAIL')

  link += `/${keys.searchKey}/${keys.verificationKey}`

  return link
}
