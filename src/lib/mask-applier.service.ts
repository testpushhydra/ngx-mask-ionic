import { Inject, Injectable } from '@angular/core';
import { config, IConfig } from './config';

@Injectable()
export abstract class MaskApplierService {
  public dropSpecialCharacters: IConfig['dropSpecialCharacters'];
  public showTemplate: IConfig['showTemplate'];
  public clearIfNotMatch: IConfig['clearIfNotMatch'];
  public maskExpression = '';
  public maskSpecialCharacters: IConfig['specialCharacters'];
  public maskAvailablePatterns: IConfig['patterns'];
  public prefix: IConfig['prefix'];
  public sufix: IConfig['sufix'];
  public customPattern: IConfig['patterns'];

  private _shift: Set<number>;

  public constructor(@Inject(config) protected _config: IConfig) {
    this._shift = new Set();
    this.maskSpecialCharacters = this._config!.specialCharacters;
    this.maskAvailablePatterns = this._config.patterns;
    this.clearIfNotMatch = this._config.clearIfNotMatch;
    this.dropSpecialCharacters = this._config.dropSpecialCharacters;
    this.maskSpecialCharacters = this._config!.specialCharacters;
    this.maskAvailablePatterns = this._config.patterns;
    this.prefix = this._config.prefix;
    this.sufix = this._config.sufix;
  }
  // tslint:disable-next-line:no-any
  public applyMaskWithPattern(
    inputValue: string,
    maskAndPattern: [string, IConfig['patterns']]
  ): string {
    const [mask, customPattern] = maskAndPattern;
    this.customPattern = customPattern;
    return this.applyMask(inputValue, mask);
  }
  public applyMask(
    inputValue: string,
    maskExpression: string,
    position: number = 0,
    cb: Function = () => {}
  ): string {
    if (
      inputValue === undefined ||
      inputValue === null ||
      maskExpression === undefined
    ) {
      return '';
    }

    let cursor = 0;
    let result = ``;
    let multi = false;

    if (inputValue.slice(0, this.prefix.length) === this.prefix) {
      inputValue = inputValue.slice(this.prefix.length, inputValue.length);
    }

    const inputArray: string[] = inputValue.toString().split('');

    // tslint:disable-next-line
    for (
      let i: number = 0, inputSymbol: string = inputArray[0];
      i < inputArray.length;
      i++, inputSymbol = inputArray[i]
    ) {
      if (cursor === maskExpression.length) {
        break;
      }
      if (
        this._checkSymbolMask(inputSymbol, maskExpression[cursor]) &&
        maskExpression[cursor + 1] === '?'
      ) {
        result += inputSymbol;
        cursor += 2;
      } else if (
        maskExpression[cursor + 1] === '*' &&
        multi &&
        this._checkSymbolMask(inputSymbol, maskExpression[cursor + 2])
      ) {
        result += inputSymbol;
        cursor += 3;
        multi = false;
      } else if (
        this._checkSymbolMask(inputSymbol, maskExpression[cursor]) &&
        maskExpression[cursor + 1] === '*'
      ) {
        result += inputSymbol;
        multi = true;
      } else if (
        maskExpression[cursor + 1] === '?' &&
        this._checkSymbolMask(inputSymbol, maskExpression[cursor + 2])
      ) {
        result += inputSymbol;
        cursor += 3;
      } else if (this._checkSymbolMask(inputSymbol, maskExpression[cursor])) {
        if (maskExpression[cursor] === 'd') {
          if (Number(inputSymbol) > 3) {
            result += 0;
            cursor += 1;
            const shiftStep: number = /\*|\?/g.test(
              maskExpression.slice(0, cursor)
            )
              ? inputArray.length
              : cursor;
            this._shift.add(shiftStep + this.prefix.length || 0);
            i--;
            continue;
          }
        }
        if (maskExpression[cursor - 1] === 'd') {
          if (Number(inputValue.slice(cursor - 1, cursor + 1)) > 31) {
            continue;
          }
        }
        if (maskExpression[cursor] === 'm') {
          if (Number(inputSymbol) > 1) {
            result += 0;
            cursor += 1;
            const shiftStep: number = /\*|\?/g.test(
              maskExpression.slice(0, cursor)
            )
              ? inputArray.length
              : cursor;
            this._shift.add(shiftStep + this.prefix.length || 0);
            i--;
            continue;
          }
        }
        if (maskExpression[cursor - 1] === 'm') {
          if (Number(inputValue.slice(cursor - 1, cursor + 1)) > 12) {
            continue;
          }
        }
        result += inputSymbol;
        cursor++;
      } else if (
        this.maskSpecialCharacters.indexOf(maskExpression[cursor]) !== -1
      ) {
        result += maskExpression[cursor];
        cursor++;
        const shiftStep: number = /\*|\?/g.test(maskExpression.slice(0, cursor))
          ? inputArray.length
          : cursor;
        this._shift.add(shiftStep + this.prefix.length || 0);
        i--;
      } else if (
        this.maskSpecialCharacters.indexOf(inputSymbol) > -1 &&
        this.maskAvailablePatterns[maskExpression[cursor]] &&
        this.maskAvailablePatterns[maskExpression[cursor]].optional
      ) {
        cursor++;
        i--;
      } else if (
        this.maskExpression[cursor + 1] === '*' &&
        this._findSpecialChar(this.maskExpression[cursor + 2]) &&
        this._findSpecialChar(inputSymbol) === this.maskExpression[cursor + 2]
      ) {
        cursor += 3;
        result += inputSymbol;
      }
    }

    if (
      result.length + 1 === maskExpression.length &&
      this.maskSpecialCharacters.indexOf(
        maskExpression[maskExpression.length - 1]
      ) !== -1
    ) {
      result += maskExpression[maskExpression.length - 1];
    }

    let shift = 1;
    let newPosition: number = position + 1;

    while (this._shift.has(newPosition)) {
      shift++;
      newPosition++;
    }

    cb(this._shift.has(position) ? shift : 0);
    let res = `${this.prefix}${result}`;
    res =
      this.sufix && cursor === maskExpression.length
        ? `${this.prefix}${result}${this.sufix}`
        : `${this.prefix}${result}`;
    return res;
  }
  public _findSpecialChar(inputSymbol: string): undefined | string {
    const symbol: string | undefined = this.maskSpecialCharacters.find(
      (val: string) => val === inputSymbol
    );
    return symbol;
  }

  private _checkSymbolMask(inputSymbol: string, maskSymbol: string): boolean {
    this.maskAvailablePatterns = this.customPattern
      ? this.customPattern
      : this.maskAvailablePatterns;
    return (
      this.maskAvailablePatterns[maskSymbol] &&
      this.maskAvailablePatterns[maskSymbol].pattern &&
      this.maskAvailablePatterns[maskSymbol].pattern.test(inputSymbol)
    );
  }
}
