import * as THREE from "three";

export type HEADER_CONTENT = {
  info: string;
  render: boolean;
  text?: string;
  time?: CONTENT_TIME[];
}


export type CONTENT_TIME = {
  from: string,
  until?: string,
}

export type CONTENT_IFRAME = {
  link: string,
  widht: string,
  height: string,
}

export type CONTENT_IMAGE = {
  link: string,
  widht: string,
}

export type CONTENT_NAME = {
  text: string,
  color: string,
}

export type CONTENT_TYPE = "PRIMERY_SCHOOL" | "SECONDARY_SCHOOL" | "INTERNSHIP" | "COMPETITION"

export type CONTENT = {
  name: CONTENT_NAME,
  image: string,
  iframe?: CONTENT_IFRAME,
  href?: string,
  text?: string,
  time?: CONTENT_TIME[]
  children?: CONTENT[]
  type: CONTENT_TYPE,
  position: THREE.Vector3,
  rotation: THREE.Euler
}