import React from 'react';
import { connect } from 'react-redux';
import { logUserOut } from '../../actions/authentication';

import HeaderPage from './HeaderPage';

class HeaderContainer extends React.Component{
	constructor(props) {
    super(props);

    this.logUserOutFunction = this.logUserOutFunction.bind(this);
  	}

  	logUserOutFunction() {
    	const {dispatch} = this.props;
    	dispatch(logUserOut());
  	}
	render(){
		const { authentication } = this.props;

		return(
			<HeaderPage  authentication={authentication} logUserOutFunction={this.logUserOutFunction} />
		);
	}
}

export default connect()(HeaderContainer);