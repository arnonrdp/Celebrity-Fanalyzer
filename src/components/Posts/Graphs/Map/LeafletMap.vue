<template>
  <q-select
    v-model="selectedDataType"
    :options="dataOptions"
    label="Filter By"
    outlined
    dense
    class="q-mb-lg q-select-class"
    data-test="filter-select"
  />
  <div class="total-countries">
    <div>
      Total Countries Participated:
      <span style="color: #e54757">{{ totalCountriesParticipated }}</span>
    </div>
    <div>
      Total Countries by
      <span style="font-weight: 600">{{ selectedDataType.label }}:</span>
      <span style="color: #e54757">{{ ' ' }}{{ totalCountries }}</span>
    </div>
  </div>

  <div class="overall-stats">
    Country with most participants:
    <span style="font-weight: 600">{{ countryWithMostParticipants.country }}</span>
    <span style="font-weight: 600">{{ ' ' }}{{ countryWithMostParticipants.icon }}</span>
    <div
      style="font-weight: 400; font-size: 13px; display: flex; gap: 4px"
      v-if="
        countryWithMostParticipants.totalComments ||
        countryWithMostParticipants.totalLikes ||
        countryWithMostParticipants.totalDislikes ||
        countryWithMostParticipants.totalShares
      "
    >
      <span class="text-weight-medium text-primary">Comments: {{ countryWithMostParticipants.totalComments }}</span>
      <span class="text-weight-medium text-primary">Likes: {{ countryWithMostParticipants.totalLikes }}</span>
      <span class="text-weight-medium text-primary">Dislikes: {{ countryWithMostParticipants.totalDislikes }}</span>
      <span class="text-weight-medium text-primary">Shares: {{ countryWithMostParticipants.totalShares }}</span>
    </div>
  </div>
  <!--  <div class="overall-stats">Overall Stats by Countries:</div>-->

  <div id="map" @mousedown.stop.prevent @touchstart="handleTouchStart"></div>
</template>

<script setup>
import { computed, nextTick, ref, toRaw, watch, watchEffect } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useStatStore } from 'src/stores'
import { handleComments, handleLikesAndDislikes, handleShares } from 'components/Posts/Graphs/Map/handlingFunctions'
import { countries } from 'components/Posts/Graphs/Map/countries'

const statStore = useStatStore()
const mapRef = ref(null)
const totalCountries = ref(0)

const allInteractions = statStore.getAllInteractionsByCountry?.response
const interactionsExists = allInteractions?.some((el) => el.interactions?.likes || el.interactions?.dislikes)
const commentsExists = allInteractions?.some((el) => el.comments)
const sharesExist = allInteractions?.some((el) => el.shares)
const selectedDataType = ref(
  interactionsExists
    ? { label: 'Likes and dislikes', value: 'interactions' }
    : commentsExists
      ? { label: 'Comments', value: 'comments' }
      : { label: 'Shares', value: 'shares' }
)

const initialDataOptions = [
  { label: 'Likes and dislikes', value: 'interactions' },
  { label: 'Comments', value: 'comments' },
  { label: 'Shares', value: 'shares' }
]

const dataOptions = ref(
  initialDataOptions.filter(
    (option) =>
      (option.value === 'interactions' && interactionsExists) ||
      (option.value === 'comments' && commentsExists) ||
      (option.value === 'shares' && sharesExist)
  )
)

const updateDataOptions = () => {
  dataOptions.value = initialDataOptions.filter(
    (option) =>
      (option.value === 'interactions' && interactionsExists) ||
      (option.value === 'comments' && commentsExists) ||
      (option.value === 'shares' && sharesExist)
  )

  if (!dataOptions.value.some((option) => option.value === selectedDataType.value.value)) {
    selectedDataType.value = dataOptions.value[0] || null
  }
  updateTotalCountries()
}

const updateTotalCountries = () => {
  if (!allInteractions) return

  if (selectedDataType.value.value === 'interactions') {
    totalCountries.value = allInteractions.filter((el) => el.interactions?.likes || el.interactions?.dislikes).length
  } else if (selectedDataType.value.value === 'comments') {
    totalCountries.value = allInteractions.filter((el) => el.comments).length
  } else if (selectedDataType.value.value === 'shares') {
    totalCountries.value = allInteractions.filter((el) => el.shares).length
  }
}

const getFlagEmoji = (countryCode) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

const totalCountriesParticipated = computed(() => {
  return new Set(allInteractions.map((entry) => entry.location)).size
})

const countryWithMostParticipants = computed(() => {
  const maxCountryCode = allInteractions.reduce(
    (maxCountry, entry) => {
      const totalParticipation = entry.comments + entry.interactions.likes + entry.interactions.dislikes + entry.shares
      if (totalParticipation > maxCountry.participation) {
        return {
          country: entry.location,
          participation: totalParticipation,
          totalComments: entry.comments,
          totalLikes: entry.interactions.likes,
          totalDislikes: entry.interactions.dislikes,
          totalShares: entry.shares
        }
      }

      return maxCountry
    },
    { country: null, participation: 0 }
  )
  const icon = getFlagEmoji(maxCountryCode.country)

  const allEqual = allInteractions.every((entry) => {
    const totalParticipations = entry.comments + entry.interactions.likes + entry.interactions.dislikes + entry.shares
    return totalParticipations === maxCountryCode.participation
  })

  if (allEqual && allInteractions.length > 1) {
    return { country: 'Equal participation. 🌍' }
  }
  return {
    country: countries.find((country) => country.code === maxCountryCode.country)?.country,
    icon,
    totalLikes: maxCountryCode.totalLikes,
    totalDislikes: maxCountryCode.totalDislikes,
    totalShares: maxCountryCode.totalShares,
    totalComments: maxCountryCode.totalComments
  }
})

// Map initialization
const initMap = async () => {
  if (allInteractions && Object.keys(allInteractions).length) {
    await nextTick()

    if (toRaw(mapRef.value)) {
      toRaw(mapRef.value).eachLayer((layer) => {
        toRaw(mapRef.value).removeLayer(layer)
      })
    } else {
      mapRef.value = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
        maxBoundsViscosity: 0
      })
    }

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 10,
      minZoom: 3
    }).addTo(toRaw(mapRef.value))
    const bounds = [
      [-85, -180],
      [85, 180]
    ]

    toRaw(mapRef.value).setMaxBounds(bounds)
    toRaw(mapRef.value).fitBounds(bounds)

    if (selectedDataType.value.value === 'interactions' && interactionsExists) {
      handleLikesAndDislikes(allInteractions, mapRef)
    } else if (selectedDataType.value.value === 'comments' && commentsExists) {
      handleComments(allInteractions, mapRef)
    } else if (selectedDataType.value.value === 'shares' && sharesExist) {
      handleShares(allInteractions, mapRef)
    }

    window.addEventListener('resize', () => {
      toRaw(mapRef.value).invalidateSize()
    })
  }
}

const handleTouchStart = (e) => {
  e.stopPropagation()
}

watchEffect(() => {
  if (allInteractions) {
    updateDataOptions()
    initMap()
  }
})

watch(selectedDataType, async (newValue, oldValue) => {
  if (newValue !== oldValue) {
    await initMap()
  }
})

watch(
  () => allInteractions,
  () => {
    updateDataOptions()
    initMap()
  }
)
</script>

<style>
#map {
  height: 80vh;
  border-radius: 20px;
  touch-action: none;

  @media (max-width: 720px) {
    height: 60vh;
  }
}

.q-select-class {
  width: 20%;
  position: absolute;
  z-index: 3;
  top: 10px;
  left: 10px;

  @media (max-width: 1024px) {
    width: 60%;
  }
}

.q-select-class > :first-child > :first-child {
  background-color: white !important;
}

@media (min-width: 1024px) {
  .row > .col-md-6 {
    height: auto;
    width: 49%;
    padding: 10px;
  }
}

.total-countries {
  left: 10px;
  position: absolute;
  top: 60px;
  border: 1px solid #c2c2c2;
  border-radius: 5px;
  padding: 5px 12px;
  background-color: white;
  z-index: 3;
  transition: all 0.6s;

  display: flex;
  flex-direction: column;
  gap: 10px;
}

.overall-stats {
  position: absolute;
  top: 135px;
  left: 10px;
  z-index: 3;
  border: 1px solid #c2c2c2;
  border-radius: 5px;
  padding: 5px 12px;
  background-color: white;
}

.total-countries:hover {
  border-color: #000000;
}
</style>
