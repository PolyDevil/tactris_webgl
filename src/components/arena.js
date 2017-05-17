import { Object3D } from 'three';
import TWEEN from 'tween';
import { FIGURES, DIMENSION, ARRAY, SCALE, STATUS } from './consts';
import Box from './box';

const SIDE = 2;
const MARGIN = 0.4;

export default class Arena extends Object3D {
  constructor($figures, $generate, $gameOver) {
    super();

    this.SIZE = SIDE + MARGIN;
    this.position.set(-this.SIZE * (DIMENSION - 1) / 2, -this.SIZE * (DIMENSION - 1) / 2, 0);

    this.order = {
      x: [],
      y: [],
      mask: []
    };
    this.state = [];
    this.touches = [];

    this.boxes = [];
    this.box = new Box(SCALE);

    this.figures = $figures;
    this.generate = $generate;
    this.gameOver = $gameOver;

    this.render();
  }

  render() {
    ARRAY.forEach(i => {
      this.order.x.push(i);
      this.order.y.push(i);
      this.order.mask.push(i);
      ARRAY.forEach(() => {
        this.state.push(STATUS.untouched.code);
      });
    });

    this.state.forEach((state, id) => {
      const clone = this.box.clone();
      const x = id % DIMENSION;
      const y = Number.parseInt(id / DIMENSION, 10);
      clone.userData = {
        x,
        y,
        z: 0,
        id: id
      };
      clone.material = this.box.material.clone();
      clone.position.set(this.order.x.indexOf(x) * this.SIZE, this.order.y.indexOf(y) * this.SIZE, 1);
      clone.scale.set(0.1, 0.1, 0.1);

      let emissive;
      switch (state) {
        case STATUS.untouched.code:
          emissive = new TWEEN.Tween(clone.material.emissive).to(STATUS.untouched.emissive, 500);
          break;
        case STATUS.touched.code:
          emissive = new TWEEN.Tween(clone.material.emissive).to(STATUS.touched.emissive, 500);
          break;
        case STATUS.placed.code:
          emissive = new TWEEN.Tween(clone.material.emissive).to(STATUS.placed.emissive, 500);
          break;
        default:
          console.log('error');
      }

      if (emissive) {
        const scaleOut = new TWEEN.Tween(clone.scale).to({
          x: 0.1,
          y: 0.1,
          z: 0.1
        }, 500);
        const scaleIn = new TWEEN.Tween(clone.scale).to({
          x: SCALE,
          y: SCALE,
          z: SCALE
        }, 500);
        scaleOut.chain(scaleIn);
        scaleOut.chain(scaleIn, emissive).start();
      }

      this.boxes.push(clone);
      this.add(clone);
    });

  }

  lineShift($line, $direction, $delay = 0) {
    const _order = this.order[$direction];
    const _line = _order.indexOf($line);
    const _linesToShift = _line > (DIMENSION - 1) / 2 ? _order.slice(_line, DIMENSION) : _order.slice(0, _line + 1).reverse();
    const linesToShift = _linesToShift.map((line, index) => {
      return {
        index: line,
        diff: index ? 1 : -1 * (_linesToShift.length - 1)
      };
    });

    const polarity = _line > ((DIMENSION - 1) / 2) ? 1 : -1;

    linesToShift.forEach((line, index) => {
      this.order[$direction].forEach(el => {
        const id = $direction === 'x' ? el * DIMENSION + line.index : line.index * DIMENSION + el;
        const block = this.boxes[id];

        if (index === 0) {
          const position = new TWEEN.Tween(block.position).to({
            [$direction]: (this.order[$direction].indexOf(line.index) - polarity * line.diff) * this.SIZE
          }, 200).onComplete(() => block.visible = true);
          const scaleOut = new TWEEN.Tween(block.scale).to({
            x: 0.1,
            y: 0.1,
            z: 0.1
          }, 250).onComplete(() => block.visible = false);
          const scaleIn = new TWEEN.Tween(block.scale).to({
            x: SCALE,
            y: SCALE,
            z: SCALE
          }, 250);
          const emissive = new TWEEN.Tween(block.material.emissive).to(STATUS.untouched.emissive, 250);
          position.chain(scaleIn);
          scaleOut.chain(position, emissive).delay(1000 * $delay).start();
          this.state[id] = STATUS.untouched.code;
        } else {
          new TWEEN.Tween(block.position).to({
            [$direction]: (this.order[$direction].indexOf(line.index) - polarity * line.diff) * this.SIZE
          }, 700).delay(1000 * $delay).start();
        }
      });
    });

    this.order[$direction].splice(this.order[$direction].indexOf(linesToShift[0].index), 1);
    if (polarity > 0) {
      this.order[$direction].push(linesToShift[0].index);
    } else {
      this.order[$direction].unshift(linesToShift[0].index);
    }
  }

  setState($id, $status) {
    this.state[$id] = $status.code;
    new TWEEN.Tween(this.boxes[$id].material.emissive).to($status.emissive, 0)
    .easing(TWEEN.Easing.Exponential.Out).start();
  }

  touch($id) {
    switch (this.state[$id]) {
      case STATUS.untouched.code:
        this.state[$id] = 0;
        if (this.touches.length === 4) {
          const id = this.touches.shift();
          this.setState(id, STATUS.untouched);
        }
        if (this.touches.indexOf($id) === -1) {
          this.touches.push($id);
        }
        this.setState($id, STATUS.touched);
        this.checkFigure();
        break;
      case STATUS.touched.code:
        // this.setState($id, STATUS.placed);
        break;
      case STATUS.placed.code:
        // this.setState($id, STATUS.untouched);
        break;
      default:
        console.log('error');
    }
  }

  checkFigure() {
    if (this.touches.length === 4) {
      if (this.figures.length === 2) {
        const touches = this.touches.map(touch => {
          return {
            x: this.order.x.indexOf(touch % DIMENSION),
            y: this.order.y.indexOf(Number.parseInt(touch / DIMENSION, 10))
          };
        });
        // _n is a Block with coordinates [0, 0] in 4x4 pole
        const n = {
          x: touches[0].x,
          y: touches[0].y
        };

        // _h is a area of Blocks where user can probably place the figure. Max figure length and width is 4 blocks, so we dont need to check all blocks, just 16 of them (4x4)
        const h = touches.map(touch => {
          n.x = Math.min(n.x, touch.x);
          n.y = Math.min(n.y, touch.y);
          return touch;
        }).sort((a, b) => a.x - b.x !== 0 ? a.x - b.x : a.y - b.y);

        const fs = this.figures.map(figure => FIGURES[figure]);
        fs.forEach((figure, figureIndex) => {
          if (figure.every((f, i) => f.x === h[i].x - n.x && f.y === h[i].y - n.y ? true : false)) {
            this.touches.forEach(touch => {
              this.setState(touch, STATUS.placed);
            });
            this.touches = [];
            this.generate(figureIndex);
            this.checkLines();
            this.isGameover();
          }
        });
      }
    }
  }

  checkLines() {
    const mask = this.order.mask;
    const xs = mask.slice();
    const ys = mask.slice();

    this.state.forEach((_s, _i) => {
      if (_s !== STATUS.placed.code) {
        const _x = _i % DIMENSION;
        const _y = Number.parseInt(_i / DIMENSION, 10);
        if (xs.indexOf(_x) !== -1) {
          xs.splice(xs.indexOf(_x), 1);
        }
        if (ys.indexOf(_y) !== -1) {
          ys.splice(ys.indexOf(_y), 1);
        }
      }
    });

    const toT = ys.filter(_e => _e >= DIMENSION / 2).sort((_a, _b) => this.order.y.indexOf(_a) - this.order.y.indexOf(_b)); // toTop     +y
    const toR = xs.filter(_e => _e >= DIMENSION / 2).sort((_a, _b) => this.order.x.indexOf(_a) - this.order.x.indexOf(_b)); // toRight   +x
    const toB = ys.filter(_e => _e < DIMENSION / 2).sort((_a, _b) => this.order.y.indexOf(_b) - this.order.y.indexOf(_a));  // toBottom  -y
    const toL = xs.filter(_e => _e < DIMENSION / 2).sort((_a, _b) => this.order.x.indexOf(_b) - this.order.x.indexOf(_a));  // toLeft    -x

    toT.forEach((_y, _i) => this.lineShift(_y, 'y', _i));
    toR.forEach((_x, _i) => this.lineShift(_x, 'x', _i));
    toB.forEach((_y, _i) => this.lineShift(_y, 'y', _i));
    toL.forEach((_x, _i) => this.lineShift(_x, 'x', _i));
  }

  _canPlaceFigure($figure) {
    const size = $figure.reduce((c, p) => {
      return { x: Math.max(c.x, p.x), y: Math.max(c.y, p.y) };
    });
    return this.state.some((s, i) => {
      const x = i % DIMENSION;
      const y = Number.parseInt(i / DIMENSION, 10);
      if (!(x + size.x + 1 > DIMENSION || y + size.y + 1 > DIMENSION)) {
        return $figure.every(cell => {
          const id = this.order.y[cell.y + y] * DIMENSION + this.order.x[cell.x + x];
          return this.state[id] === STATUS.untouched.code;
        });
      }
      return false;
    });
  }

  isGameover() {
    const figures = this.figures.map(figure => FIGURES[figure]);

    const isGameOver = !figures.some(figure => this._canPlaceFigure(figure));

    if (isGameOver) {
      this.gameOver();
      this.reset();
    }
  }

  reset() {
    this.order = {
      x: [],
      y: [],
      mask: []
    };
    this.state = [];
    this.touches = [];

    ARRAY.forEach(i => {
      this.order.x.push(i);
      this.order.y.push(i);
      this.order.mask.push(i);
      ARRAY.forEach(() => {
        this.state.push(STATUS.untouched.code);
      });
    });
    this.state.forEach((state, id) => {
      const _x = id % DIMENSION;
      const _y = Number.parseInt(id / DIMENSION, 10);
      const box = this.boxes[id];

      const emissive = new TWEEN.Tween(box.material.emissive).to(STATUS.untouched.emissive, 500);
      const position = new TWEEN.Tween(box.position).to({
        x: this.order.x.indexOf(_x) * this.SIZE, y: this.order.y.indexOf(_y) * this.SIZE, z: 1
      }, 500);
      emissive.chain(position).start();
    });
  }

}
