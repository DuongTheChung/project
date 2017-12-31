import React from 'react';
import { connect } from 'react-redux';
import { checkSession } from '../actions/authentication';

import Template from './Template';

class TemplateContainer extends React.Component{
	constructor(props) {
    super(props);
    this.checkUserSession = this.checkUserSession.bind(this);
  }

  componentWillMount() {
    this.checkUserSession();
  }

  checkUserSession() {
    const { dispatch } = this.props;
    dispatch(checkSession());
  }

	render(){
		const { authentication } = this.props;
		return(
			<Template authentication = {authentication}/>
		);
	}
}


function mapStateToProps(state) {
  return {
    authentication: state.authentication
  };
}

export default connect(mapStateToProps)(TemplateContainer);