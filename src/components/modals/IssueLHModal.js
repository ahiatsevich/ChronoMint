import { connect } from 'react-redux'
import React, { Component } from 'react'
import { Dialog, FlatButton, RaisedButton, CircularProgress } from 'material-ui'
import IconButton from 'material-ui/IconButton'
import NavigationClose from 'material-ui/svg-icons/navigation/close'
import IssueLHForm from '../forms/IssueLHForm'
import { issueLH } from '../../redux/locs/list/actions'

const mapStateToProps = state => {
  return {
    isIssuing: state.getIn(['locs', state.get('loc').getAddress()]).isIssuing()
  }
}

const mapDispatchToProps = (dispatch) => ({
  issueLH: (params) => dispatch(issueLH(params))
})

@connect(mapStateToProps, mapDispatchToProps)
class IssueLHModal extends Component {
  handleSubmit = (values) => {
    const issueAmount = +values.get('issueAmount')
    const address = values.get('address')
    this.handleClose()
    return this.props.issueLH({issueAmount, address})
  }

  handleSubmitClick = () => {
    this.refs.IssueLHForm.getWrappedInstance().submit()
  }

  handleClose = () => {
    this.props.hideModal()
  }

  render () {
    const {open, pristine, isIssuing} = this.props
    const actions = [
      <FlatButton
        label='Cancel'
        primary
        onTouchTap={this.handleClose}
      />,
      <RaisedButton
        label={'ISSUE LHT'}
        primary
        onTouchTap={this.handleSubmitClick.bind(this)}
        disabled={pristine || isIssuing}
      />
    ]

    return (
      <Dialog
        title={<div>
          Issue LHT
          <IconButton style={{float: 'right', margin: '-12px -12px 0px'}} onTouchTap={this.handleClose}>
            <NavigationClose />
          </IconButton>
        </div>}
        actions={actions}
        actionsContainerStyle={{padding: 26}}
        titleStyle={{paddingBottom: 10}}
        modal
        open={open}
        contentStyle={{position: 'relative'}}
      >
        <IssueLHForm ref='IssueLHForm' onSubmit={this.handleSubmit} />
        {isIssuing
          ? <CircularProgress size={24} thickness={1.5} style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translateX(-50%) translateY(-50%)'
          }} />
          : null}
      </Dialog>
    )
  }
}

export default IssueLHModal
