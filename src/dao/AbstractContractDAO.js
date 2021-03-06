// noinspection NpmUsedModulesInstalled
import truffleContract from 'truffle-contract'
import validator from '../components/forms/validator'
import web3Provider from '../network/Web3Provider'
import LS from '../utils/LocalStorage'
import IPFS from '../utils/IPFS'
import AbstractModel from '../models/AbstractModel'
import TransactionExecModel from '../models/TransactionExecModel'
import Web3Converter from '../utils/Web3Converter'

/**
 * @type {number} to distinguish old and new blockchain events
 * @see AbstractContractDAO._watch
 */
const timestampStart = Date.now()

const MAX_ATTEMPTS_TO_RISE_GAS = 3
const DEFAULT_GAS = 200000

/**
 * Collection of all blockchain events to stop watching all of them via only one call of...
 * @see AbstractContractDAO.stopWatching
 * @type {Array}
 */
let events = []

export default class AbstractContractDAO {
  /**
   * @type {Web3Converter}
   * @protected
   */
  _c = Web3Converter

  constructor (json, at = null) {
    if (new.target === AbstractContractDAO) {
      throw new TypeError('Cannot construct AbstractContractDAO instance directly')
    }
    this._json = json
    this._at = at
    this._defaultBlock = 'latest'

    this._initWeb3()
    this.contract = this._initContract()
    this.contract.catch(() => false)
  }

  /**
   * @returns {boolean|Promise}
   * @private
   */
  _initWeb3 () {
    web3Provider.onReset(() => {
      this.contract = this._initContract()
    })
    return web3Provider.getWeb3().then(web3 => {
      this.web3 = web3
      return web3
    })
  }

  /** @private */
  _initContract (web3 = null) {
    return new Promise((resolve, reject) => {
      if (this._at !== null && validator.address(this._at) !== null) {
        reject(new Error('invalid address passed'))
      }
      (web3 === null ? web3Provider.getWeb3() : Promise.resolve(web3))
        .then(web3 => {
          const contract = truffleContract(this._json)
          contract.setProvider(web3.currentProvider)
          return contract[this._at === null ? 'deployed' : 'at'](this._at)
        })
        .then(i => {
          this._at = i.address
          resolve(i)
        })
        .catch(e => reject(e))
    })
  }

  /** @returns {Promise.<bool>} */
  isDeployed () {
    return new Promise(resolve => {
      this._initContract(web3Provider.getWeb3instance())
        .then(() => resolve(true))
        .catch(e => {
          console.error(e)
          return resolve(false)
        })
    })
  }

  getAddress () {
    return this._at ? Promise.resolve(this._at) : this.contract.then(deployed => deployed.address)
  }

  getContractName () {
    return this._json.contract_name
  }

  setDefaultBlock (block) {
    this._defaultBlock = block
  }

  // noinspection JSUnusedGlobalSymbols
  getData (func: string, args: Array = []) {
    return this.contract.then(deployed => {
      if (!deployed.contract.hasOwnProperty(func)) {
        throw new Error('unknown function ' + func + ' in contract ' + this.getContractName())
      }
      return deployed.contract[func].getData.apply(null, args)
    })
  }

  /**
   * This is only for test purposes.
   * TODO MINT-162 Tokens decimals
   * @param amount
   * @returns {number}
   * @protected
   */
  _addDecimals (amount: number) {
    return amount * 100000000
  }

  /**
   * @see _addDecimals
   * @param amount
   * @returns {number}
   * @protected
   */
  _removeDecimals (amount: number) {
    return amount / 100000000
  }

  /**
   * Get object from IPFS with bytes32 hash.
   * @param bytes
   * @returns {Promise.<any|null>}
   * @protected
   */
  _ipfs (bytes) {
    return IPFS.get(this._c.bytes32ToIPFSHash(bytes))
  }

  /**
   * @param address
   * @returns {boolean}
   * @protected
   */
  isEmptyAddress (address: string) {
    return address === '0x0000000000000000000000000000000000000000'
  }

  /**
   * @param func
   * @param args
   * @param block
   * @protected
   * @returns {Promise}
   */
  _call (func, args: Array = [], block) {
    block = block || this._defaultBlock
    return new Promise((resolve, reject) => {
      this.contract.then(deployed => {
        if (!deployed.hasOwnProperty(func)) {
          throw new Error('unknown function ' + func + ' in contract ' + this.getContractName())
        }
        deployed[func].call.apply(null, [...args, {}, block]).then(result => {
          resolve(result)
        }).catch(e => {
          reject(this._error('_call error', func, args, null, null, e))
        })
      })
    })
  }

  _callNum (func, args: Array = [], block) {
    return this._call(func, args, block).then(r => r.toNumber())
  }

  /**
   * Call this function before transaction
   * @see _tx
   * @see ChronoMintDAO.sendETH
   * @param tx
   */
  static txStart = (tx: TransactionExecModel) => {}

  /**
   * Optionally call this function after receiving of transaction estimated gas
   * @param tx
   */
  static txGas = (tx: TransactionExecModel) => {}

  /**
   * Call this function after transaction
   * @param tx
   * @param e
   */
  static txEnd = (tx: TransactionExecModel, e: Error = null) => {}

  /**
   * Returns function exec args associated with names from contract ABI
   * @param func
   * @param args
   * @private
   */
  _argsWithNames (func: string, args: Array = []) {
    let r = null
    for (let i in this._json.abi) {
      if (this._json.abi.hasOwnProperty(i) && this._json.abi[i].name === func) {
        const inputs = this._json.abi[i].inputs
        if (!r) {
          r = {}
        }
        for (let j in inputs) {
          if (inputs.hasOwnProperty(j)) {
            if (!args.hasOwnProperty(j)) {
              throw new Error('invalid argument ' + j)
            }
            r[inputs[j].name] = args[j]
          }
        }
        break
      }
    }
    if (!r) {
      throw new Error('argsWithNames should not be null')
    }
    return r
  }

  /** @private */
  _error (msg, func, args, value, gas, e: Error) {
    return new Error(msg + '; ' + this.getContractName() + '.' + func + '(' + args.toString() + '):' +
      value + ' [' + gas + '] ' + e.message)
  }

  /**
   * @param func
   * @param args
   * @param infoArgs key-value pairs to display in pending transactions list. If this param is empty, then it will be
   * filled with arguments names from contract ABI as a keys, args values as a values.
   * You can also pass here model, then this param will be filled with result of...
   * @see AbstractModel.summary
   * Keys is using for I18N, for details see...
   * @see TransactionExecModel.description
   * @param value wei
   * @returns {Promise}
   * @protected
   */
  _tx (func: string, args: Array = [], infoArgs: Object | AbstractModel = null, value: number = null) {
    let attemptsToRiseGas = MAX_ATTEMPTS_TO_RISE_GAS
    return new Promise((resolve, reject) => {
      infoArgs = infoArgs
        ? (typeof infoArgs['summary'] === 'function' ? infoArgs.summary() : infoArgs)
        : this._argsWithNames(func, args)

      let tx = new TransactionExecModel({
        contract: this.getContractName(),
        func,
        args: infoArgs,
        value: this._c.fromWei(value)
      })
      AbstractContractDAO.txStart(tx)
      this.contract.then(deployed => {
        const params = [...args, {from: LS.getAccount(), value}]
        const callback = (gas) => {
          tx = tx.set('gas', gas)
          AbstractContractDAO.txGas(tx)
          gas++ // if tx will spend this incremented value, then estimated gas is wrong and most likely we got out of gas
          params[params.length - 1].gas = gas // set gas to params
          return deployed[func].call.apply(null, params).then(() => { // dry run
            return deployed[func].apply(null, params).then(result => { // transaction
              if (typeof result === 'object' && result.hasOwnProperty('receipt')) {
                tx = tx.set('gasUsed', result.receipt.gasUsed)
                if (result.receipt.gasUsed === gas) {
                  attemptsToRiseGas = 0
                  throw new Error('Unknown out of gas error :( Please contact the administrators!')
                }
              }
              AbstractContractDAO.txEnd(tx)
              resolve(result)
            })
          }).catch(e => {
            if (e.message.includes('out of gas') && attemptsToRiseGas > 0) {
              --attemptsToRiseGas
              const newGas = Math.ceil(gas * 1.5)
              console.warn(this._error(`out of gas, raised to: ${newGas}, attempts left: ${attemptsToRiseGas}`,
                func, args, value, gas, e))
              return callback(newGas)
            }
            AbstractContractDAO.txEnd(tx, e)
            reject(this._error('tx', func, args, value, gas, e))
          })
        }
        deployed[func].estimateGas.apply(null, params)
          .then(gas => callback(gas))
          .catch(e => {
            console.error(this._error('Estimate gas failed, fallback to default gas', func, args, value, undefined, e))
            return callback(DEFAULT_GAS)
          })
      })
    })
  }

  /**
   * This function will read events from the last block saved in window.localStorage or from the latest network block
   * if localStorage for provided event is empty.
   * @param event
   * @param callback in the absence of error will receive event result object, block number, timestamp of event
   * in milliseconds and special isOld flag, which will be true if received event is older than timestampStart
   * @see timestampStart
   * @param id To able to save last read block, pass unique constant id to this param and don't change it if you
   * want to keep receiving of saved block number from user localStorage. This id will be concatenated with event name.
   * Pass here "false" if you want to prevent such behaviour.
   * @param filters
   * @protected
   */
  _watch (event: string, callback, id = this.getContractName(), filters = {}) {
    id = event + (id ? '-' + id : '')
    let fromBlock = id === false ? 'latest' : LS.getWatchFromBlock(id)

    return this.contract.then(deployed => {
      const instance = deployed[event](filters, {fromBlock, toBlock: 'latest'})
      events.push(instance)
      return instance.watch((e, result) => {
        if (e) {
          console.error('_watch error:', e)
          return
        }
        web3Provider.getWeb3().then(web3 => {
          web3.eth.getBlock(result.blockNumber, (e, block) => {
            if (e) {
              console.error('_watch getBlock', e)
              return
            }
            const ts = block.timestamp
            if (id !== false) {
              LS.setWatchFromBlock(id, result.blockNumber)
            }
            callback(
              result,
              result.blockNumber,
              ts * 1000,
              Math.floor(timestampStart / 1000) > ts
            )
          })
        })
      })
    })
  }

  static stopWatching () {
    events.forEach(item => item.stopWatching(() => {}))
    events = []
  }

  static getWatchedEvents () {
    return events
  }
}
