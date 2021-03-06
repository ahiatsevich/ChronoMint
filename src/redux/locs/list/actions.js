import TokenContractsDAO from '../../../dao/TokenContractsDAO'
import LOCsManagerDAO from '../../../dao/LOCsManagerDAO'
import { LOCS_FETCH_START, LOCS_FETCH_END } from '../commonProps/index'
import { LOCS_LIST, LOC_CREATE, LOC_UPDATE, LOC_REMOVE } from './reducer'
import { LOCS_COUNTER } from '../counter'

const issueLH = (data) => (dispatch) => {
  const {issueAmount, address} = data
  dispatch({type: LOC_UPDATE, data: {valueName: 'isIssuing', value: true, address}})
  return TokenContractsDAO.reissueAsset('LHT', issueAmount, address).then(() => {
    dispatch({type: LOC_UPDATE, data: {valueName: 'isIssuing', value: false, address}})
  })
}

const redeemLH = (data) => (dispatch) => {
  const {redeemAmount, address} = data
  dispatch({type: LOC_UPDATE, data: {valueName: 'isRedeeming', value: true, address}})
  return TokenContractsDAO.revokeAsset('LHT', redeemAmount, address).then(() => {
    dispatch({type: LOC_UPDATE, data: {valueName: 'isRedeeming', value: false, address}})
  }).catch(() => {
    dispatch({type: LOC_UPDATE, data: {valueName: 'isRedeeming', value: false, address}, result: 'error'})
  })
}

const handleNewLOC = (locModel) => (dispatch) => {
  dispatch({type: LOC_CREATE, data: locModel})
}

const handleRemoveLOC = (address) => (dispatch) => {
  dispatch({type: LOC_REMOVE, data: {address}})
}

const handleUpdateLOCValue = (address, valueName, value) => (dispatch) => {
  dispatch({type: LOC_UPDATE, data: {valueName, value, address}})
}

const getLOCs = () => (dispatch) => {
  dispatch({type: LOCS_FETCH_START})
  return LOCsManagerDAO.getLOCs().then(locs => {
    dispatch({type: LOCS_LIST, data: locs})
    dispatch({type: LOCS_FETCH_END})
  })
}

const getLOCsCounter = () => (dispatch) => {
  return LOCsManagerDAO.getLOCCount().then(counter => {
    dispatch({type: LOCS_COUNTER, payload: counter})
  })
}

export {
  issueLH,
  redeemLH,
  handleNewLOC,
  handleRemoveLOC,
  handleUpdateLOCValue,
  getLOCs,
  getLOCsCounter
}
