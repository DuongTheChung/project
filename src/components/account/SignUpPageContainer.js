import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import {signUpUser}  from '../../actions/authentication';

import SignUpPage from './SignUpPage';

class SignUpPageContainer extends React.Component{
	constructor(props) {
    super(props);

    	this.signUpUserInFunction = this.signUpUserInFunction.bind(this);
	}

	signUpUserInFunction(userData){
		const {dispatch}=this.props;
		dispatch(signUpUser(userData));
	}
	
	render(){
		const { isLoggedIn, registrationSucceeded } = this.props.authentication;

	    // Forward to a success page
	    if (registrationSucceeded) {
	      return (
	        <Redirect to="/" />
	      );
	    }

	    // User needs to be logged out to register
	    if (isLoggedIn) {
	      return (<p>Please log out before registering a new user</p>);
	    }
		return(
			<div className="container">
				<SignUpPage signUpFunction={this.signUpUserInFunction} />
			</div>
		);
	}

}

function mapStateToProps(state) {
  return {
    authentication: state.authentication,
  };
}

export default connect(mapStateToProps)(SignUpPageContainer);
