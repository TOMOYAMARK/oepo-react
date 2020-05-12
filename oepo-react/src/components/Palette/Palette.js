import React from 'react';
import {Button, Paper, Box} from '@material-ui/core';
import Draggable from 'react-draggable';
import Slider from './Slider';
import './style.scss';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackRoundedIcon from '@material-ui/icons/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@material-ui/icons/ArrowForwardRounded';
import DeleteForeverRoundedIcon from '@material-ui/icons/DeleteForeverRounded';
import BrushIcon from '@material-ui/icons/Brush';
import { Icon, InlineIcon } from '@iconify/react';
import eraserIcon from '@iconify/icons-mdi/eraser';
import dragIcon from '@iconify/icons-mdi/drag';

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
    const styles = {
      button: {
        width: 30,
        height: 30,
        padding: 0,
        margin: 2,
      },
      icon: {
        fontSize: 30,
        color: '#fffff',
      },
      tooltip: {
        marginLeft: 7,
      }
    }
    return (
      <Draggable handle=".handle">
        <Paper elevation={3} style={{ width: 580 }}>
          <Box display="flex">
            <Box
              style={{
                width: 30,
                margin: 5
              }}
            >
              <IconButton
                style={styles.button}
                iconStyle={styles.icon}
                tooltipStyles={styles.tooltip}
                onClick={e => this.props.onChangeState('draw')}
              >
                <BrushIcon />
              </IconButton>
              <IconButton
                style={styles.button}
                iconStyle={styles.icon}
                tooltipStyles={styles.tooltip}
                onClick={e => this.props.onChangeState('erase')}
              >
                <Icon icon={eraserIcon} />
              </IconButton>
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
            <Box style={{ width: 30, margin: 5}}>
              <IconButton
                style={styles.button} 
                iconStyle={styles.icon} 
                tooltipStyles={styles.tooltip}
                disabled={!this.props.backable}
                onClick={e => this.props.onBack()}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
              <IconButton
                style={styles.button}
                iconStyle={styles.icon}
                tooltipStyles={styles.tooltip}
                disabled={!this.props.forwardable}
                onClick={e => this.props.onForward()}
              >
                <ArrowForwardRoundedIcon/>
              </IconButton>
            </Box>
            <Box style={{ width: 40, margin: 5 }}>
              <Icon className="handle" style={{
                width: 30, height: 30, margin: 2
              }} icon={dragIcon} />
              <IconButton style={styles.button} iconStyle={styles.icon} tooltipStyles={styles.tooltip}>
                <DeleteForeverRoundedIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Draggable>
    );
  }
}
