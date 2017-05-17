import { Object3D } from 'three';
import TWEEN from 'tween';
import { FIGURES, DIMENSION, SCALE } from './consts';
import Box from './box';

const SIDE = 2;
const MARGIN = 0.4;

export default class Figures extends Object3D {
  constructor($figures) {
    super();

    this.BAZE = 6;
    this.SIDE = SIDE * DIMENSION / 2 / this.BAZE;
    this.SIZE = (SIDE + MARGIN) * DIMENSION / 2 / this.BAZE;

    this.position.set(0, -((DIMENSION / 2) * (SIDE + MARGIN) + (this.BAZE / 2) * this.SIZE), 0);

    this.boxes = [];
    this.box = new Box(SCALE / this.BAZE * DIMENSION / 2);

    this.figures = $figures;

    this.render();
  }

  update($index, $figure) {
    this.figures[$index] = $figure;

    const _el = {
      index: $index,
      id: $figure,
      figure: FIGURES[$figure]
    };

    const _boxes = this.boxes[$index].children;

    const size = { min: { x: _el.figure[0].x, y: _el.figure[0].y }, max: { x: _el.figure[0].x, y: _el.figure[0].y } };
    _el.figure.forEach(coord => {
      if (coord.x > size.max.x) {
        size.max.x = coord.x;
      } else if (coord.x < size.min.x) {
        size.min.x = coord.x;
      }
      if (coord.y > size.max.y) {
        size.max.y = coord.y;
      } else if (coord.y < size.min.y) {
        size.min.y = coord.y;
      }
    });

    _boxes.forEach((box, _i) => {
      const _x = (_el.figure[_i].x - (size.max.x - size.min.x) / 2) * this.SIZE;
      const _y = (_el.figure[_i].y - (size.max.y - size.min.y) / 2) * this.SIZE;
      const _z = 1;
      new TWEEN.Tween(box.position).to({
        x: _x,
        y: _y,
        z: _z
      }, 700)
      .easing(TWEEN.Easing.Quintic.In).start();
    });
  }

  render() {
    const figures = this.figures.map((figure, index) => {
      return {
        index: index,
        id: figure,
        figure: FIGURES[figure]
      };
    });

    figures.forEach((_el, index) => {
      const size = { min: { x: _el.figure[0].x, y: _el.figure[0].y }, max: { x: _el.figure[0].x, y: _el.figure[0].y } };
      const _group = new Object3D();
      const clones = [];
      _el.figure.forEach(coord => {
        if (coord.x > size.max.x) {
          size.max.x = coord.x;
        } else if (coord.x < size.min.x) {
          size.min.x = coord.x;
        }
        if (coord.y > size.max.y) {
          size.max.y = coord.y;
        } else if (coord.y < size.min.y) {
          size.min.y = coord.y;
        }
      });
      _el.figure.forEach(coord => {
        const clone = this.box.clone();
        clone.material = this.box.material.clone();
        clone.userData = {
          x: coord.x,
          y: coord.y,
          z: 1,
          id: index
        };
        const _x = (coord.x - (size.max.x - size.min.x) / 2) * this.SIZE;
        const _y = (coord.y - (size.max.y - size.min.y) / 2) * this.SIZE;
        const _z = 1;
        clone.position.set(_x, _y, _z);
        clones.push(clone);
        _group.add(clone);
      });
      _group.position.set((2 * index - 1) * 1 / 2 * this.SIZE * this.BAZE, 0, 0);
      this.boxes.push(_group);
      this.add(_group);
    });
  }
}
