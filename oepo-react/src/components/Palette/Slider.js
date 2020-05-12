import React from 'react';
import './style.scss';

export default class Slider extends React.Component {  
  render() {
    return (
      <div
        className="slider-container"
        style={{
          position: "relative",
          width: 200,
          height: 30,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: [
              `.slider-main-${this.props.id} {
                position: absolute;
                top: 0;
                left: 0;
                -webkit-appearance: none;
                appearance: none;
                opacity: 1;
                width: 200px;
                background: #DDD;
                height: 2px;
                outline: none;
                margin: 0;
              }`,
              `.slider-main-${this.props.id}::-webkit-slider-thumb {`,
              ' -webkit-appearance: none;',
              ' appearance: none;',
              ` width: ${this.props.weight}px;`,
              ` height: ${this.props.weight}px;`,
              ' border-radius: 50%;',
              ' background-color: ' + (this.props.color ? this.props.color : "black") + ";",
              ' opacity: ' + (this.props.opacity ? this.props.opacity : "1") + ";",
              ' cursor: pointer;',
              '}',
              `.slider-sub::-webkit-slider-thumb {`,
              ' -webkit-appearance: none;',
              ' appearance: none;',
              ` width: 20px;`,
              ` height: 20px;`,
              ' left: -5px;',
              ' border-radius: 50%;',
              // ' border: 1px solid;',
              ' background-color: transparent;',
              ' cursor: pointer;',
              '}'
              ].join('\n')
            }}>
          </style>
          <input
            type="range"
            min={this.props.min}
            max={this.props.max}
            step={this.props.step}
            value={this.props.value}
            onChange={e => this.props.onChange(e)}
            className={"slider-main-" + this.props.id}
          />
          <input
            type="range"
            min={this.props.min}
            max={this.props.max}
            step={this.props.step}
            value={this.props.value}
            onChange={e => this.props.onChange(e)}
            className="slider-sub"
          />
        </div>
      </div>
    );
  }
}