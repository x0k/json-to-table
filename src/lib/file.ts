export function createJSONBlob(json: string) {
  return new Blob([json], { type: 'application/json' })
}

export function createXLSBlob(data: ArrayBuffer) {
  return new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8',
  })
}

export function createFileURL(data: MediaSource | Blob) {
  return URL.createObjectURL(data)
}

export function makeDownloadFileByUrl(filename: string) {
  return (url: string) => {
    const a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', filename)
    a.click()
  }
}

export function readFileAsText(file: Blob) {
  return new Promise<ProgressEvent<FileReader>>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = resolve
    reader.onerror = reject
    return reader.readAsText(file)
  })
}

export function getFileName(disposition: string) {
  const utf8FilenameRegex = /filename\*=UTF-8''([\w%\-.]+)(?:; ?|$)/
  const asciiFilenameRegex = /filename=(["']?)(.*?[^\\])\1(?:; ?|$)/

  let fileName: string | null = null
  if (utf8FilenameRegex.test(disposition)) {
    fileName = decodeURIComponent(
      (utf8FilenameRegex.exec(disposition) as RegExpExecArray)[1]
    )
  } else {
    const matches = asciiFilenameRegex.exec(disposition)
    if (matches != null && matches[2]) {
      fileName = matches[2]
    }
  }
  return fileName
}
