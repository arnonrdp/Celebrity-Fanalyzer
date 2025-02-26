<template>
  <TheHeader :subtitle="post?.title" title="Anthrogram" />
  <q-page-container class="anthogram-page-container">
    <q-page>
      <section class="q-py-md">
        <q-tabs active-color="primary" align="justify" class="text-grey q-mb-xl" dense indicator-color="primary" v-model="interval">
          <q-tab name="daily" label="Daily" data-test="q-tab-daily" />
          <q-tab name="weekly" label="Weekly" data-test="q-tab-weekly" />
          <q-tab name="monthly" label="Monthly" data-test="q-tab-monthly" />
        </q-tabs>
        <q-separator spaced="xl" />

        <div class="row justify-between" style="justify-content: space-between; gap: 10px">
          <div
            v-if="!!visitorStore?.getVisitors?.length"
            v-bind:class="statStore.getStats && hasValidStats ? 'col-md-6' : 'col-md-12'"
            class="col-12 anthogram-border"
            data-test="visitors-bar"
          >
            <VisitorsBar :data="visitorStore?.getVisitors" :interval="interval" />
          </div>
          <div
            v-if="hasValidStats && statStore.getStats"
            v-bind:class="!!visitorStore?.getVisitors?.length ? 'col-md-6' : 'col-md-12'"
            class="col-12 anthogram-border"
            data-test="half-donought"
          >
            <HalfDonought :stats="statStore.getStats" :title="'User\'s total activity'" />
          </div>
        </div>
        <div v-if="isAdd" class="anthogram-border q-my-sm" data-test="ctr-bar">
          <CTRBar :interval="interval" :impressionsData="impressionsStore.getImpressions" :clicksData="clickStore.getClicks" />
        </div>

        <div class="row" style="justify-content: space-between; gap: 10px; margin-top: 10px">
          <div
            class="col-12 anthogram-border"
            v-if="!!shareStore?.getSharesStats?.length"
            v-bind:class="!!likeStore.getLikes?.length || !!likeStore.getDislikes?.length ? 'col-md-6' : 'col-md-12'"
            data-test="shares-pie"
          >
            <q-skeleton v-if="shareStore?.isLoading" width="100%" height="40vh" />
            <SharesPie v-else :data="shareStore?.getSharesStats" :interval="interval" />
          </div>
          <div
            class="col-12 anthogram-border"
            v-if="!!likeStore.getLikes?.length || !!likeStore.getDislikes?.length"
            v-bind:class="!!shareStore?.getSharesStats?.length ? 'col-md-6' : 'col-md-12'"
            data-test="likes-bar"
          >
            <LikesBar :data="{ likes: likeStore.getLikes ?? [], dislikes: likeStore.getDislikes ?? [] }" :interval="interval" />
          </div>
        </div>

        <div class="row" style="justify-content: space-between; gap: 10px">
          <div
            class="col-12 anthogram-border rating-chart"
            v-if="!!statStore.getArticleRate"
            v-bind:class="!!statStore.getUserRate ? 'col-md-6' : 'col-md-12'"
            data-test="article-popularity"
          >
            <PopularityGauge :ratingValue="statStore.getArticleRate" :title="'Post popularity rating'" />
          </div>
          <div
            class="col-12 anthogram-border rating-chart"
            v-if="!!statStore.getUserRate"
            v-bind:class="!!statStore.getArticleRate ? 'col-md-6' : 'col-md-12'"
            data-test="user-popularity"
          >
            <PopularityGauge :ratingValue="statStore.getUserRate" :title="'User rating'" />
          </div>
        </div>

        <q-separator spaced="xl" />
        <div class="row q-mb-lg" v-if="!!statStore.getAllInteractionsByCountry?.response?.length">
          <div class="col-12 relative-position" data-test="leaflet-map">
            <LeafletMap />
          </div>
        </div>
      </section>
    </q-page>
  </q-page-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import LikesBar from './Graphs/LikesBar.vue'
import SharesPie from './Graphs/SharesPie.vue'
import VisitorsBar from './Graphs/VisitorsBar.vue'
import TheHeader from 'src/components/shared/TheHeader.vue'
import LeafletMap from './Graphs/Map/LeafletMap.vue'
import { useClicksStore, useErrorStore, useImpressionsStore, useLikeStore, useShareStore, useStatStore, useVisitorStore } from 'src/stores'
import HalfDonought from './Graphs/HalfDonought.vue'
import PopularityGauge from './Graphs/PopularityGauge.vue'
import CTRBar from './Graphs/CTRBar.vue'

const props = defineProps(['post', 'isAdd', 'collectionName'])

const likeStore = useLikeStore()
const shareStore = useShareStore()
const visitorStore = useVisitorStore()
const impressionsStore = useImpressionsStore()
const clickStore = useClicksStore()
const errorStore = useErrorStore()
const statStore = useStatStore()

const interval = ref('daily')

const hasValidStats = computed(() => {
  return statStore.getStats?.some(
    (stat) => stat.clicks > 0 || stat.keypresses > 0 || stat.mouseMovements > 0 || stat.scrolls > 0 || stat.totalTime > 0
  )
})

onMounted(async () => {
  try {
    await Promise.all([
      visitorStore.readVisitors(props.collectionName, props.post.id),
      shareStore.fetchSharesStats(props.collectionName, props.post.id),
      statStore.fetchStats(props.post.id),
      statStore.getArticleRating(props.post.id),
      statStore.getArticleMetrics(props.post.id)
    ])
  } catch (error) {
    errorStore.throwError(error)
  }
})

onUnmounted(() => {
  statStore.resetStats()
})
</script>

<style scoped>
.anthogram-page-container {
  max-width: 1450px;
}

.anthogram-border {
  border: 1px solid rgba(128, 128, 128, 0.45);
  border-radius: 10px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  padding: 20px;
}

.rating-chart {
  min-height: 350px;

  @media (max-width: 426px) {
    min-height: 250px;
  }

  margin-top: 10px;
}
</style>
