import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { Paper, FlatButton, RaisedButton, CircularProgress } from 'material-ui'
import ProfileForm from '../components/forms/ProfileForm'
import styles from '../styles'
import ProfileModel from '../models/ProfileModel'
import { showDepositTIMEModal } from '../redux/ui/modal'
import { requireTIME, updateTIMEBalance, updateTIMEDeposit } from '../redux/wallet/actions'
import { updateUserProfile } from '../redux/session/actions'
import LS from '../utils/LocalStorage'

const mapStateToProps = (state) => ({
  isEmpty: state.get('session').profile.isEmpty(),
  isTimeBalance: !!state.get('wallet').time.balance,
  isTimeFetching: !!state.get('wallet').time.isFetching
})

const mapDispatchToProps = (dispatch) => ({
  handleClose: () => dispatch(push('/')),
  updateBalance: () => dispatch(updateTIMEBalance()),
  updateDeposit: () => dispatch(updateTIMEDeposit()),
  updateProfile: (profile: ProfileModel) => dispatch(updateUserProfile(profile)),
  handleDepositTime: () => dispatch(showDepositTIMEModal()),
  handleRequireTime: () => dispatch(requireTIME(LS.getAccount()))
})

@connect(mapStateToProps, mapDispatchToProps)
class ProfilePage extends Component {
  componentWillMount () {
    this.props.updateBalance()
    this.props.updateDeposit()
  }

  handleSubmit = (values) => {
    this.props.updateProfile(new ProfileModel(values))
  }

  handleSubmitClick = () => {
    this.refs.ProfileForm.getWrappedInstance().submit()
  }

  render () {
    return (
      <div>
        <span style={styles.navigation}>ChronoMint / Profile</span>

        <Paper style={styles.paper}>
          {!this.props.isTimeFetching ? (
            <div>
              {!this.props.isTimeBalance && <p><b>Deposit TIME if you want get access to Voting and Rewards.</b></p>}
              <RaisedButton
                label='REQUIRE TIME'
                primary
                style={{marginRight: '20px', marginBottom: '10px'}}
                onTouchTap={this.props.handleRequireTime}
                buttonStyle={{...styles.raisedButton}}
                labelStyle={styles.raisedButtonLabel}
                disabled={this.props.isTimeFetching || this.props.isTimeBalance}
                />
              <RaisedButton
                label='DEPOSIT OR WITHDRAW TIME TOKENS'
                primary
                onTouchTap={this.props.handleDepositTime}
                buttonStyle={{...styles.raisedButton}}
                labelStyle={styles.raisedButtonLabel}
                disabled={this.props.isTimeFetching || !this.props.isTimeBalance}
                />
            </div>
          ) : <CircularProgress size={24} thickness={1.5} style={{margin: '0 auto', display: 'block'}} />}
        </Paper>

        <br />

        <Paper style={styles.paper}>
          <h3 style={styles.title}>Profile</h3>

          {this.props.isEmpty ? <p><b>Your profile is empty. Please at least specify your name.</b></p> : ''}

          <ProfileForm ref='ProfileForm' onSubmit={this.handleSubmit} />

          <p>&nbsp;</p>
          <RaisedButton
            label={'Save'}
            primary
            style={{marginRight: '20px'}}
            onTouchTap={this.handleSubmitClick}
          />
          <FlatButton
            label='Cancel'
            onTouchTap={this.props.handleClose}
          />
        </Paper>
      </div>
    )
  }
}

export default ProfilePage
