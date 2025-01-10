// Available endpoints : https://developers.brevo.com/docs/available-functions-in-api-clients
import env from '#start/env'
import Except from '#utils/except'
import logger from '@adonisjs/core/services/logger'
import brevoSdk, {
  TransactionalEmailsApi,
  AccountApi,
  SendSmtpEmail,
  ContactsApi,
} from '@getbrevo/brevo'

import savedTemplates from '#services/brevo/saved_templates'
import savedContactsLists from '#services/brevo/saved_contacts_lists'

export default class Brevo {
  private _instance: any
  private _apiKey: string
  private _apiTransactional: TransactionalEmailsApi
  private _apiContact: ContactsApi
  private _ready: boolean = false

  get isReady(): boolean {
    return this._ready
  }

  get instanceTransac(): TransactionalEmailsApi {
    return this._apiTransactional
  }

  constructor() {
    this._instance = brevoSdk
    this._apiKey = env.get('BV_API_KEY')

    this._apiTransactional = new this._instance.TransactionalEmailsApi()
    this._apiContact = new this._instance.ContactsApi()
  }

  async init() {
    if (!this._apiTransactional) {
      Except.serviceUnavailable('intern', {
        debug: '[service] Brevo - TransactionalEmailsApi could not be instantiated',
      })
      return
    }

    this._apiTransactional.setApiKey(
      this._instance.TransactionalEmailsApiApiKeys.apiKey,
      this._apiKey
    )

    this._apiContact.setApiKey(this._instance.ContactsApiApiKeys.apiKey, this._apiKey)

    await this.checkAccount()
    this._ready = true
  }

  private async checkAccount() {
    const accountApi: AccountApi = new this._instance.AccountApi()

    accountApi.setApiKey(this._instance.AccountApiApiKeys.apiKey, this._apiKey)
    await accountApi
      .getAccount()
      .then((resp) =>
        logger.info(`[service] Brevo - Account reached, company: ${resp.body?.companyName}`)
      )
      .catch((error) =>
        Except.serviceUnavailable('none', {
          debug: {
            message:
              '[service] Brevo - AccountApi cannot be reached, assuming TransactionalApi either if apiKey error',
            body: error.body,
            statusCode: error.statusCode,
          },
        })
      )
  }

  async sendTest() {
    return await this.sendTransacEmail(savedTemplates.test, env.get('BV_RECEIVER_TEST'), {
      PARAM: 'Params too',
    })
  }

  async sendCreateAccount(
    to: string,
    params: { MLINK: string },
    options: SendSmtpEmail = {}
  ): Promise<boolean> {
    return await this.sendTransacEmail(savedTemplates.connect, to, params, options)
  }

  async sendConnect(
    to: string,
    params: { MLINK: string },
    options: SendSmtpEmail = {}
  ): Promise<boolean> {
    return await this.sendTransacEmail(savedTemplates.createAccount, to, params, options)
  }

  async sendNewEmail(to: string, params: { MLINK: string }, options: SendSmtpEmail = {}) {
    return await this.sendTransacEmail(savedTemplates.newEmail, to, params, options)
  }

  async sendTransacEmail(
    templateId: number,
    to: string,
    params: Record<string, string> = {},
    transacEmail: SendSmtpEmail = {}
  ) {
    transacEmail.templateId = templateId

    if (!transacEmail.to) transacEmail.to = [{ email: to }]
    else transacEmail.to.unshift({ email: to })

    transacEmail.params = params

    if (!transacEmail.sender)
      transacEmail.sender = {
        email: env.get('BV_SENDER_EMAIL_DEFAULT'),
        name: env.get('BV_SENDER_NAME_DEFAULT'),
      }

    let isSent = false
    await this._apiTransactional
      .sendTransacEmail(transacEmail)
      .then(() => (isSent = true))
      .catch((error) =>
        Except.internalServerError('none', { debug: { message: "Couldn't send email", error } })
      )

    return isSent
  }

  async addInTestList(contact: Record<string, string> & { email: string }) {
    return await this.addContact([savedContactsLists.test], contact)
  }

  async removeFromTestList(emails: string | string[]) {
    const contactsEmails = Array.isArray(emails) ? emails : [emails]

    return await this.removeContacts(savedContactsLists.test, contactsEmails)
  }

  async addContact(listIds: number[], contact: Record<string, string> & { email: string }) {
    let isAdded = false

    const { email, ...attributes } = contact

    await this._apiContact
      .createContact({
        email,
        listIds,
        updateEnabled: true,
        attributes,
      })
      .then(() => (isAdded = true))
      .catch((error) =>
        Except.internalServerError('none', { debug: { message: "Couldn't add contact", error } })
      )

    return isAdded
  }

  async removeContacts(listId: number, emails: string[]) {
    let isRemoved = false

    const contacts = new brevoSdk.RemoveContactFromList()
    contacts.emails = emails

    await this._apiContact
      .removeContactFromList(listId, contacts)
      .then(() => (isRemoved = true))
      .catch((error) =>
        Except.internalServerError('none', { debug: { message: "Couldn't remove contact", error } })
      )

    return isRemoved
  }
}
