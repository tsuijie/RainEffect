import React from "react";
import init from './rain'

export default class RainView extends React.Component {
  canvas = React.createRef();
  componentDidMount() {
    const canvas = this.canvas.current;
    init(canvas);
  }

  render() {
    return (
      <>
        <canvas ref={ this.canvas } />
        <div style={{ position: "absolute", top: 0, left: 0, padding: 15 }}>
          <div>Build with React.</div>
        </div>
      </>
    );
  }
}