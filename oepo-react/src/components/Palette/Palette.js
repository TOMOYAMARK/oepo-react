import React from 'react';
import {Button, Paper, Box} from '@material-ui/core';
import Draggable from 'react-draggable';
import Slider from './Slider';
import './style.scss';

export default class Palette extends React.Component {
  render() {
    const colorButtons = this.props.colors.map(color => {
      return (
        <Button
          key={color}
          variant="contained"
          onClick={e => this.props.onClickColor(color)}
          style={{
            maxWidth: "30px",
            maxHeight: "30px",
            minWidth: "30px",
            minHeight: "30px",
            margin: "2px",
            backgroundColor: color
          }}
        >
          {" "}
        </Button>
      );
    });
    return (
      <Draggable handle=".handle">
        <Paper elevation={3} style={{ width: 630 }}>
          <Box display="flex">
            <Box
              style={{
                width: 90,
                margin: 5
              }}
            >
              <Button
                variant="contained"
                onClick={e => this.props.onChangeState('erase')}
                style={{
                  maxWidth: "30px",
                  maxHeight: "64px",
                  minWidth: "30px",
                  minHeight: "64px",
                  margin: "2px 5px",
                  backgroundColor: "white",
                  fontSize: 11
                }}
              >
                ゴム
              </Button>
              <Button
                variant="contained"
                onClick={e => this.props.onChangeState('draw')}
                style={{
                  maxWidth: "30px",
                  maxHeight: "64px",
                  minWidth: "30px",
                  minHeight: "64px",
                  margin: "2px 5px",
                  backgroundColor: "white",
                  fontSize: 11
                }}
              >
                ペン
              </Button>
            </Box>
            <Box
              style={{
                width: 200,
                marginLeft: 10,
                marginTop: 10,
                marginRight: 10
              }}
            >
              <Slider
                id="weight"
                value={this.props.weight}
                weight={this.props.weight}
                opacity={this.props.opacity}
                color={this.props.color}
                onChange={e => this.props.onChangeWeight(e)}
                min="3"
                max="30"
                step="3"

              />
              <Slider
                id={"opacity"}
                value={this.props.opacity}
                weight={this.props.weight}
                opacity={this.props.opacity}
                color={this.props.color}
                onChange={e => this.props.onChangeOpacity(e)}
                min="0.1"
                max="1"
                step="0.05"
              />
            </Box>
            <Box style={{ width: 220, margin: 5 }}>
              <Box style={{ width: 220, margin: 0 }}>{colorButtons}</Box>
              <Box style={{ width: 220, margin: 0 }}>{colorButtons}</Box>
            </Box>
            <Box style={{ width: 40, margin: 5 }}>
              <Button
                variant="contained"
                onClick={e => console.log("click")}
                style={{
                  maxWidth: "30px",
                  maxHeight: "64px",
                  minWidth: "30px",
                  minHeight: "50px",
                  margin: "2px 0px",
                  backgroundColor: "white",
                  fontSize: 11
                }}
              >
                初期化
              </Button>
            </Box>
            <div
              className="handle"
              style={{ width: 20, margin: 5, backgroundColor: "gray" }}
            />
          </Box>
        </Paper>
      </Draggable>
    );
  }
}
