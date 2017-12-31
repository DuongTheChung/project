import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import {logInUser}  from '../../actions/authentication';

import LoginPage from './LoginPage';

class LoginContainer extends React.Component{
	constructor(props) {
    super(props);

    	this.logUserInFunction = this.logUserInFunction.bind(this);
	}

	logUserInFunction(userData){
		const {dispatch}=this.props;
		dispatch(logInUser(userData));
	}
	
	render(){
		const { authentication } = this.props;

    	if (authentication.isLoggedIn) {
     	 return (
        	<Redirect to="/" />
      	);
    	}
    	
		return(
			<div className="container">
				<LoginPage loginFunction={this.logUserInFunction} />
			</div>
		);
	}

}

function mapStateToProps(state) {
  return {
    authentication: state.authentication,
  };
}

export default connect(mapStateToProps)(LoginContainer);
