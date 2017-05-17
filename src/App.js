import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Canvas from './components/canvas';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      canvas: {}
    };
  }

  componentDidMount() {
    this.setState({
      canvas: new Canvas(ReactDOM.findDOMNode(this))
    });
  }

  render() {
    return (
      <main />
    );
  }
}

export default App;
