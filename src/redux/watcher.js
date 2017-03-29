import LOCsManagerDAO from '../dao/LOCsManagerDAO'
import PendingManagerDAO from '../dao/PendingManagerDAO'
import {handleNewLOC, handleRemoveLOC, handleUpdateLOCValue} from './locs/actions'

import VoteDAO from '../dao/VoteDAO'
import {watchInitCBE} from './settings/cbe'
import {watchInitToken} from './settings/tokens'
import {watchInitContract as watchInitOtherContract} from './settings/otherContracts'

import {handlePendingConfirmation, handleRevokeOperation} from './pendings/data'
import {handleNewPoll, handleNewVote} from './polls/data'

// Important! Action creator below is only for CBE events
export const cbeWatcher = (account) => (dispatch) => {
  /** SETTINGS >>> **/
  dispatch(watchInitCBE(account))
  dispatch(watchInitToken(account))
  dispatch(watchInitOtherContract(account))
  /** <<< SETTINGS **/

  LOCsManagerDAO.newLOCWatch((locModel, ts) => dispatch(handleNewLOC(locModel, ts)), account)
  LOCsManagerDAO.remLOCWatch((address, ts) => dispatch(handleRemoveLOC(address, ts)))
  LOCsManagerDAO.updLOCStatusWatch((address, status, ts) => dispatch(handleUpdateLOCValue(address, 'status', status, ts)))
  LOCsManagerDAO.updLOCValueWatch((address, valueName, value, ts) => dispatch(handleUpdateLOCValue(address, valueName, value, ts)))
  LOCsManagerDAO.updLOCStringWatch((address, valueName, value, ts) => dispatch(handleUpdateLOCValue(address, valueName, value, ts)))
  PendingManagerDAO.newConfirmationWatch((operation) => dispatch(handlePendingConfirmation(operation, account)))
  PendingManagerDAO.newRevokeOperationWatch((operation) => dispatch(handleRevokeOperation(operation, account)))
  VoteDAO.newPollWatch((index) => dispatch(handleNewPoll(index)))
  VoteDAO.newVoteWatch((index) => dispatch(handleNewVote(index)))

  // ^ Free string above is for your watchers ^
}