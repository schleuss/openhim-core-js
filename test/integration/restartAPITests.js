/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

import sinon from 'sinon'
import request from 'supertest'
import { ChannelModelAPI } from '../../src/model/channels'
import { MediatorModelAPI } from '../../src/model/mediators'
import * as constants from '../constants'
import * as server from '../../src/server'
import * as testUtils from '../utils'
import { promisify } from 'util'

describe('API Integration Tests', () => {
  const { SERVER_PORTS } = constants

  describe('Restart REST Api testing', () => {
    let authDetails = {}

    const channel = new ChannelModelAPI({
      name: 'TestChannel1',
      urlPattern: 'test/sample',
      allow: ['PoC', 'Test1', 'Test2'],
      routes: [{
        name: 'test route',
        host: 'localhost',
        port: 9876,
        primary: true
      }],
      txViewAcl: ['group1'],
      txViewFullAcl: []
    })

    before(async () => {
      await testUtils.setupTestUsers()
      await channel.save()
      await promisify(server.start)({ apiPort: SERVER_PORTS.apiPort })
    })

    after(async () => {
      await testUtils.cleanupTestUsers()
      await ChannelModelAPI.remove()
      await promisify(server.stop)()
    })

    beforeEach(() => { authDetails = testUtils.getAuthDetails() })

    describe('*restart()', () => {
      it('should successfully send API request to restart the server', async () => {
        const stub = sinon.stub(server, 'startRestartServerTimeout')
        await request(constants.BASE_URL)
          .post('/restart')
          .set('auth-username', testUtils.rootUser.email)
          .set('auth-ts', authDetails.authTS)
          .set('auth-salt', authDetails.authSalt)
          .set('auth-token', authDetails.authToken)
          .send()
          .expect(200)
        stub.calledOnce.should.be.true()
      })

      it('should not allow non admin user to restart the server', async () => {
        await request(constants.BASE_URL)
          .post('/restart')
          .set('auth-username', testUtils.nonRootUser.email)
          .set('auth-ts', authDetails.authTS)
          .set('auth-salt', authDetails.authSalt)
          .set('auth-token', authDetails.authToken)
          .send()
          .expect(403)
      })
    })
  })
})
