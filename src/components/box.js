import { Mesh, Texture, MirroredRepeatWrapping, BufferGeometry, BufferAttribute, MeshStandardMaterial, NearestFilter } from 'three';
import { TEXTURE, BOX } from './consts';

export default class Box extends Mesh {
  constructor($scale) {
    const mapImage = new Image();
    mapImage.src = TEXTURE.map;
    const _map = new Texture();
    _map.image = mapImage;
    mapImage.onload = () => _map.needsUpdate = true;
    _map.repeat.set(1, 1);
    _map.wrapS = _map.wrapT = MirroredRepeatWrapping;

    const envMapImage = new Image();
    envMapImage.src = TEXTURE.envMap;
    const _envMap = new Texture();
    _envMap.image = envMapImage;
    envMapImage.onload = () => _envMap.needsUpdate = true;
    _envMap.repeat.set(1, 1);
    _envMap.wrapS = _envMap.wrapT = MirroredRepeatWrapping;

    const geometry = new BufferGeometry();
    geometry.addAttribute('uv', new BufferAttribute(new Float32Array(BOX.uv), 2));
    geometry.addAttribute('position', new BufferAttribute(new Float32Array(BOX.position), 3));
    geometry.addAttribute('normal', new BufferAttribute(new Float32Array(BOX.normal), 3));

    const material = new MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.35,
      metalness: 1,
      roughnessMap: _map,
      envMap: _envMap
    });

    super(geometry, material);

    this.material.roughnessMap.magFilter = NearestFilter;
    this.scale.multiplyScalar($scale);
  }
}
