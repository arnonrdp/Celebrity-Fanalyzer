export const waitUntil = (callback, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!callback()) {
        reject('waitUntil Timeout after' + timeout)
      }
    }, timeout)
    if (callback()) {
      resolve()
    } else {
      const intervalId = setInterval(() => {
        if (callback()) {
          clearInterval(intervalId)
          resolve()
        }
      }, 10)
    }
  }).catch(() => {
    console.log('WaitUntil Timeout after ' + timeout + ' ms')
    console.log('Try to increase you default timeout\n')

    const error = new Error()
    console.log('Stack trace:', error.stack)
  })
}
