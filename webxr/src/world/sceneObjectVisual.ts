import * as THREE from 'three'
import { SCENE_OBJECT_SCALE } from '@/config/scene-object'

/** Bottom-center pivot so placement Y sits on the floor (image-blaster parity). */
export function footPivotOffset(object: THREE.Object3D): THREE.Vector3 {
  const box = new THREE.Box3().setFromObject(object)
  const center = new THREE.Vector3()
  box.getCenter(center)
  return new THREE.Vector3(-center.x, -box.min.y, -center.z)
}

export function scaledPlacementScale(scale: [number, number, number]): [number, number, number] {
  return [
    SCENE_OBJECT_SCALE * scale[0],
    SCENE_OBJECT_SCALE * scale[1],
    SCENE_OBJECT_SCALE * scale[2],
  ]
}
