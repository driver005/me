export type CONTENT_TIME = {
  from: string,
  until: string,
}

export type CONTENT = {
  name: string,
  link: string,
  time: CONTENT_TIME[]
}