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

export type CONTENT = {
  name: string,
  image?: CONTENT_IMAGE,
  iframe?: CONTENT_IFRAME,
  href?: string,
  text?: string,
  time?: CONTENT_TIME[]
  children?: CONTENT[]
}