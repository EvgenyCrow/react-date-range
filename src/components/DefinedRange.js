import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from '../styles';
import { defaultInputRanges, defaultStaticRanges } from '../defaultRanges';
import { rangeShape } from './DayCell';
import cx from 'classnames';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';

import MaskedInput from 'react-text-mask';
import createAutoCorrectedDatePipe from 'text-mask-addons/dist/createAutoCorrectedDatePipe';

const autoCorrectedDatePipe = createAutoCorrectedDatePipe('mm/dd/yyyy', {
  minYear: '2017',
  maxYear: new Date().getFullYear().toString(),
});

function getDateForPickersInterval(dateD) {
  let date = new Date(dateD);
  let monthNumber = +date.getMonth() + 1;
  let year = date.getFullYear();
  let month = monthNumber.toString().length < 2 ? '0' + monthNumber : monthNumber;
  let day = date.getDate().toString().length < 2 ? '0' + date.getDate() : date.getDate();

  return month.toString() + day.toString() + year.toString();
}

function getDateFromMask(maskString) {
  let maskNumbers = maskString.split('/');
  return new Date(+maskNumbers[2], +maskNumbers[0] - 1, +maskNumbers[1]);
}

function TextMaskCustom(props) {
  const { inputRef, ...other } = props;

  return (
    <MaskedInput
      {...other}
      ref={ref => {
        inputRef(ref ? ref.inputElement : null);
      }}
      mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]}
      placeholderChar={'\u2000'}
      showMask
      pipe={autoCorrectedDatePipe}
    />
  );
}

class DefinedRanges extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rangeOffset: 0,
      focusedInput: -1,
      textmasks: {
        startDate: '',
        endDate: '',
      },
    };
    this.handleRangeChange = this.handleRangeChange.bind(this);
    this.handleChangeTextMask = this.handleChangeTextMask.bind(this);
    this.getCurrentTextmaskValue = this.getCurrentTextmaskValue.bind(this);
  }

  componentDidMount() {
    this.updateTextmasks();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.ranges !== this.props.ranges) {
      this.updateTextmasks();
    }
  }

  updateTextmasks() {
    const { ranges, focusedRange } = this.props;
    const selectedRange = ranges[focusedRange[0]];
    if (!selectedRange.startDate || !selectedRange.endDate || selectedRange.disabled) return false;
    this.setState({
      textmasks: {
        startDate: getDateForPickersInterval(selectedRange.startDate),
        endDate: getDateForPickersInterval(selectedRange.endDate),
      },
    });
  }

  handleRangeChange(range) {
    const { onChange, ranges, focusedRange } = this.props;
    const selectedRange = ranges[focusedRange[0]];
    if (!onChange || !selectedRange) return;
    onChange({
      [selectedRange.key || `range${focusedRange[0] + 1}`]: { ...selectedRange, ...range },
    });
  }

  getSelectedRange(ranges, staticRange) {
    const focusedRangeIndex = ranges.findIndex(range => {
      if (!range.startDate || !range.endDate || range.disabled) return false;
      return staticRange.isSelected(range);
    });
    const selectedRange = ranges[focusedRangeIndex];
    return { selectedRange, focusedRangeIndex };
  }

  handleChangeTextMask(event, name) {
    if (event.target.value.toString().trim().length === 10) {
      const { ranges, focusedRange } = this.props;
      const selectedRange = ranges[focusedRange[0]];
      if (name === 'startDate') {
        let startDate = getDateFromMask(event.target.value);
        let endDate = selectedRange.endDate;
        if (startDate.getTime() > endDate.getTime()) {
          this.handleRangeChange({
            startDate: startDate,
            endDate: startDate,
          });
          return;
        }
      }
      if (name === 'endDate') {
        let endDate = getDateFromMask(event.target.value);
        let startDate = selectedRange.startDate;
        if (startDate.getTime() > endDate.getTime()) {
          this.handleRangeChange({
            startDate: endDate,
            endDate: endDate,
          });
          return;
        }
      }
      this.handleRangeChange({ [name]: getDateFromMask(event.target.value) });
    }
  }

  getCurrentTextmaskValue(name) {
    const { textmasks } = this.state;
    return textmasks[name];
  }

  render() {
    const { ranges, rangeColors, className } = this.props;
    return (
      <div className={cx(styles.definedRangesWrapper, className)}>
        {this.props.headerContent}
        <div className={styles.staticRanges}>
          {this.props.staticRanges.map((staticRange, i) => {
            const { selectedRange, focusedRangeIndex } = this.getSelectedRange(ranges, staticRange);
            return (
              <button
                type="button"
                className={cx(styles.staticRange, {
                  [styles.staticRangeSelected]: Boolean(selectedRange),
                })}
                style={{
                  color: selectedRange
                    ? selectedRange.color || rangeColors[focusedRangeIndex]
                    : null,
                }}
                key={i}
                onClick={() => this.handleRangeChange(staticRange.range(this.props))}>
                <span tabIndex={-1} className={styles.staticRangeLabel}>
                  {staticRange.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className={styles.inputRanges}>
          {this.props.inputRanges.map((rangeOption, i) => (
            <FormControl className={styles.inputRange} key={i}>
              <InputLabel className={styles.inputRangeLabel}>{rangeOption.label}</InputLabel>
              <Input
                className={styles.inputRangeInput}
                onFocus={() => this.setState({ focusedInput: i, rangeOffset: 0 })}
                onBlur={() => this.setState({ rangeOffset: 0 })}
                value={this.getCurrentTextmaskValue(rangeOption.name)}
                onChange={e => {
                  this.handleChangeTextMask(e, rangeOption.name);
                }}
                inputComponent={TextMaskCustom}
              />
            </FormControl>
          ))}
        </div>
        {this.props.footerContent}
      </div>
    );
  }
}

DefinedRanges.propTypes = {
  inputRanges: PropTypes.array,
  staticRanges: PropTypes.array,
  ranges: PropTypes.arrayOf(rangeShape),
  focusedRange: PropTypes.arrayOf(PropTypes.number),
  onPreviewChange: PropTypes.func,
  onChange: PropTypes.func,
  footerContent: PropTypes.any,
  headerContent: PropTypes.any,
  rangeColors: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
};

DefinedRanges.defaultProps = {
  inputRanges: defaultInputRanges,
  staticRanges: defaultStaticRanges,
  ranges: [],
  rangeColors: ['#3d91ff', '#3ecf8e', '#fed14c'],
  focusedRange: [0, 0],
};

export default DefinedRanges;
