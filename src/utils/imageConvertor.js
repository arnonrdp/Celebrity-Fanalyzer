import { useStorageStore, useErrorStore } from 'src/stores'

export async function uploadAndSetImage(imageFile, filePathAndName) {
  const storageStore = useStorageStore()
  const errorStore = useErrorStore()
  return new Promise((resolve, reject) => {
    // Validate imageFile
    if (!(imageFile instanceof Blob)) {
      const errorMessage = 'Invalid file type. Expected a Blob or File.'
      console.error(errorMessage, imageFile)
      return reject(new Error(errorMessage))
    }

    const reader = new FileReader()

    reader.onload = async (event) => {
      const imageDataURL = event?.target?.result
      const img = new Image()

      img.onload = async () => {
        const MAX_WIDTH = 2560
        const MAX_HEIGHT = 1440
        let width = img.width
        let height = img.height

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const widthRatio = MAX_WIDTH / width
          const heightRatio = MAX_HEIGHT / height
          const ratio = Math.min(widthRatio, heightRatio)

          width *= ratio
          height *= ratio
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(async (blob) => {
          try {
            const imageUrl = await storageStore.uploadFile(blob, filePathAndName)
            resolve(imageUrl)
          } catch (error) {
            await errorStore.throwError(error, 'Image upload failed')
            reject(error)
          }
        }, 'image/webp')
      }
      img.src = imageDataURL
    }

    reader.readAsDataURL(imageFile)
  })
}
