import { countries } from 'components/Posts/Graphs/Map/countries'
import L from 'leaflet'
import { toRaw } from 'vue'

export const handleLikesAndDislikes = (data, mapRef) => {
  if (!Array.isArray(data)) return

  const minLikes = Math.min(...data.map((item) => item.interactions.likes + item.interactions.dislikes || 0))
  const maxLikes = Math.max(...data.map((item) => item.interactions.likes + item.interactions.dislikes || 0))

  const minRadius = 20000
  const maxRadius = 150000

  data.forEach((countryData) => {
    const totalInteractions = countryData.interactions.likes + countryData.interactions.dislikes
    if (totalInteractions > 0) {
      const commentsLocation = countries.find((country) => country.code === countryData.location)?.country
      const popupContent = `Country: ${commentsLocation}<br>Total Likes: ${countryData.interactions.likes}<br>Total Dislikes: ${countryData.interactions.dislikes}`

      let normalizedRadius = minRadius + ((totalInteractions - minLikes) / (maxLikes - minLikes)) * (maxRadius - minRadius)
      normalizedRadius = Math.max(minRadius, Math.min(normalizedRadius, maxRadius))

      const circleOptions = {
        autoClose: false,
        closeOnClick: false,
        radius: normalizedRadius || minRadius,
        fillOpacity: 0.5,
        color: '#e54757',
        fillColor: '#e54757',
        weight: 1.4
      }

      const countryCoordinates = countries.find((country) => country.code === countryData.location)?.coordinates
      if (countryCoordinates) {
        L.circle(countryCoordinates, circleOptions).addTo(toRaw(mapRef.value)).bindPopup(popupContent)
      }
    }
  })
}

export const handleComments = (data, mapRef) => {
  if (!Array.isArray(data)) return

  const minComments = Math.min(...data.map((item) => item.comments || 0))
  const maxComments = Math.max(...data.map((item) => item.comments || 0))

  const minRadius = 20000
  const maxRadius = 120000

  data.forEach((countryData) => {
    const commentsCount = countryData.comments || 0
    if (commentsCount > 0) {
      const commentsCoordinates = countries.find((country) => country.code === countryData.location)?.coordinates
      const commentsLocation = countries.find((country) => country.code === countryData.location)?.country

      if (commentsCoordinates) {
        let normalizedRadius = minRadius + ((commentsCount - minComments) / (maxComments - minComments)) * (maxRadius - minRadius)
        normalizedRadius = Math.max(minRadius, Math.min(normalizedRadius, maxRadius))

        const popupContent = `Country: ${commentsLocation}<br>Total Comments: ${commentsCount}`

        const circleOptions = {
          autoClose: false,
          closeOnClick: false,
          radius: normalizedRadius || minRadius,
          fillOpacity: 0.5,
          color: '#e54757',
          fillColor: '#e54757',
          weight: 1.4
        }

        toRaw(mapRef.value).setView(commentsCoordinates, 3)
        L.circle(commentsCoordinates, circleOptions).addTo(toRaw(mapRef.value)).bindPopup(popupContent)
      }
    }
  })
}

export const handleShares = (data, mapRef) => {
  if (!Array.isArray(data)) return
  const minShares = Math.min(...data.map((item) => item.shares || 0))
  const maxShares = Math.max(...data.map((item) => item.shares || 0))
  const minRadius = 40000
  const maxRadius = 150000

  data.forEach((countryData) => {
    const sharesCount = countryData?.shares || 0
    if (sharesCount > 0) {
      const sharesCoordinates = countries.find((country) => country.code === countryData.location)?.coordinates
      const sharesLocation = countries.find((country) => country.code === countryData.location)?.country

      if (sharesCoordinates) {
        let normalizedRadius = minRadius + ((sharesCount - minShares) / (maxShares - minShares)) * (maxRadius - minRadius)
        normalizedRadius = Math.max(minRadius, Math.min(normalizedRadius, maxRadius))

        const popupContent = `Country: ${sharesLocation}<br>Total Shares: ${sharesCount}`

        const circleOptions = {
          autoClose: false,
          closeOnClick: false,
          radius: normalizedRadius || minRadius,
          fillOpacity: 0.5,
          color: '#e54757',
          fillColor: '#e54757',
          weight: 1.4
        }

        toRaw(mapRef.value).setView(sharesCoordinates, 3)
        L.circle(sharesCoordinates, circleOptions).addTo(toRaw(mapRef.value)).bindPopup(popupContent)
      }
    }
  })
}
