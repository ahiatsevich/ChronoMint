import * as actions from '../../../src/redux/network/actions'
import { store, accounts } from '../../init'
import Web3 from 'web3'
import LS from '../../../src/utils/LocalStorage'
import { LOCAL_ID, providerMap } from '../../../src/network/settings'

describe('network actions', () => {
  it.skip('should check TESTRPC is running', () => {
    return store.dispatch(actions.checkTestRPC('http://localhost:8545')).then(() => {
      expect(store.getActions()[0]).toEqual({type: actions.NETWORK_SET_TEST_RPC})
    })
  })

  it.skip('should check METAMASK is exists', () => {
    window.web3 = new Web3()
    store.dispatch(actions.checkMetaMask()).then(() => {
      expect(store.getActions()[0]).toEqual({type: actions.NETWORK_SET_TEST_METAMASK})
    })
    window.web3 = undefined
  })

  it('should select network', () => {
    store.dispatch(actions.selectNetwork(1))
    expect(store.getActions()).toEqual([
      {type: actions.NETWORK_SET_NETWORK, selectedNetworkId: 1}
    ])
  })

  it('should select provider and reset network', () => {
    store.dispatch(actions.selectProvider(providerMap.local.id))
    expect(store.getActions()).toEqual([
      {type: actions.NETWORK_SET_NETWORK, networkId: null},
      {type: actions.NETWORK_SET_PROVIDER, selectedProviderId: providerMap.local.id}
    ])
    expect(LS.getWeb3Provider()).toEqual(providerMap.local.id)
  })

  it('should add error message', () => {
    store.dispatch(actions.addError('bug'))
    expect(store.getActions()).toEqual([
      {type: actions.NETWORK_ADD_ERROR, error: 'bug'}
    ])
  })

  it('should clear errors', () => {
    store.dispatch(actions.clearErrors())
    expect(store.getActions()).toEqual([
      {type: actions.NETWORK_CLEAR_ERRORS}
    ])
  })

  it('should select account', () => {
    store.dispatch(actions.selectAccount(123))
    expect(store.getActions()).toEqual([
      {type: actions.NETWORK_SELECT_ACCOUNT, selectedAccount: 123}
    ])
  })

  it('should load accounts', () => {
    return store.dispatch(actions.loadAccounts()).then(() => {
      expect(store.getActions()).toEqual([
        {type: actions.NETWORK_SET_ACCOUNTS, accounts: []},
        {type: actions.NETWORK_SET_ACCOUNTS, accounts}
      ])
    })
  })

  it('should restore TESTRPC state', () => {
    return store.dispatch(actions.restoreTestRPCState(accounts[0], 'http://localhost:8545')).then(() => {
      expect(store.getActions()).toEqual([
        {type: actions.NETWORK_SET_NETWORK, networkId: null},
        {type: actions.NETWORK_SET_PROVIDER, selectedProviderId: LOCAL_ID},
        {type: actions.NETWORK_SET_ACCOUNTS, accounts: []},
        {type: actions.NETWORK_SET_ACCOUNTS, accounts},
        {type: actions.NETWORK_SELECT_ACCOUNT, selectedAccount: accounts[0]}
      ])
    })
  })

  it('should clear TESTRPC state', () => {
    LS.setAccount('213')
    LS.setWeb3Provider('123')

    store.dispatch(actions.clearTestRPCState())
    expect(store.getActions()).toEqual([
      {type: actions.NETWORK_SET_NETWORK, networkId: null},
      {type: actions.NETWORK_SET_PROVIDER, selectedProviderId: null},
      {type: actions.NETWORK_SET_ACCOUNTS, accounts: []},
      {type: actions.NETWORK_SELECT_ACCOUNT, selectedAccount: null}
    ])
    expect(LS.getAccount()).toBeNull()
    expect(LS.getWeb3Provider()).toBeNull()
  })
})
