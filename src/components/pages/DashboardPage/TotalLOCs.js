import React from 'react'
import { connect } from 'react-redux'
import ThumbUp from 'material-ui/svg-icons/action/thumb-up'
import InfoBox from './InfoBox'
import { getLOCsCounter } from '../../../redux/locs/list/actions'
import { CircularProgress } from 'material-ui'

const mapStateToProps = (state) => ({
  counter: state.get('counter'),
  isFetching: state.get('locsCommunication').isFetching
})

const mapDispatchToProps = (dispatch) => ({
  getCounter: () => dispatch(getLOCsCounter())
})

@connect(mapStateToProps, mapDispatchToProps)
class TotalLOCs extends React.Component {
  componentWillMount () {
    this.props.getCounter()
  }

  render () {
    return (
      <div>
        <InfoBox Icon={ThumbUp} color='#17579c' title='LOCs'
          value={this.props.isFetching
                  ? <CircularProgress size={24} thickness={1.5} style={{marginTop: '5px'}} />
                  : <span>{this.props.counter}</span>
          }
        />
      </div>
    )
  }
}

export default TotalLOCs
