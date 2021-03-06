import AbstractContractDAO from './AbstractContractDAO'
import TIMEProxyDAO from './TIMEProxyDAO'

export const TX_DEPOSIT = 'deposit'
export const TX_WITHDRAW_SHARES = 'withdrawShares'

class TIMEHolderDAO extends AbstractContractDAO {
  approveAmount (amount: number) {
    return this.getAddress().then(address => {
      return TIMEProxyDAO.approve(address, amount)
    })
  }

  depositAmount (amount: number) {
    return this._tx(TX_DEPOSIT, [this._addDecimals(amount)], {amount})
  }

  withdrawAmount (amount: number) {
    return this._tx(TX_WITHDRAW_SHARES, [this._addDecimals(amount)], {amount})
  }

  getAccountDepositBalance (account: string) {
    return this._call('depositBalance', [account]).then(r => this._removeDecimals(r.toNumber()))
  }
}

export default new TIMEHolderDAO(require('chronobank-smart-contracts/build/contracts/TimeHolder.json'))
