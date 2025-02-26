<template>
  <TheHeader :backButton="false" logo notificationButton />

  <q-page-container>
    <q-page class="q-pa-md">
      <section class="text-center">
        <h2 class="q-my-md text-h6">Welcome to Celebrity Fanalyzer!</h2>
        <RouterLink to="month">
          <q-responsive :ratio="1" :style="{ backgroundImage: `url(${monthPrompt?.image})`, borderRadius: '300px' }">
            <div class="bg-blur flex">
              <q-img
                fit="contain"
                ratio="1"
                spinner-color="primary"
                :src="monthPrompt?.image"
                :srcset="`${monthPrompt?.image} 2x`"
                sizes="(max-width: 560) 50vw, 100vw"
                data-test="month-link"
                style="border: 3px solid #e54757; border-radius: 12px"
                loading="eager"
                fetchpriority="high"
              />
            </div>
          </q-responsive>
        </RouterLink>
        <p class="q-my-md text-body1">
          This Month's Prompt:
          <br />
          <RouterLink to="month">
            {{ monthPrompt?.title }}
          </RouterLink>
        </p>
      </section>

      <!-- *** -->

      <section class="q-my-xl text-body1">
        <article>
          <h3 class="text-bold text-h6">
            <i>“Celebrity Fanalyzer?”</i>
            &nbsp;
            <span>What’s This All About?</span>
          </h3>
          <p>
            Every month, the team at Celebrity Fanalyzer hosts an essay and/or art contest. There is a Prompt on the subject of a celebrity
            and participants give their opinion. It's that simple!
            <i>Prompts</i>
            introduce a topic and
            <i>Entries</i>
            are where thoughts are shared and discussed.
          </p>
          <p>All submissions, artwork and essays, are originals.</p>
        </article>
        <article>
          <h3 class="text-bold text-h6">But Why?!</h3>
          <p>
            Celebrity Fanalyzer is the first iteration of a multi year endeavor to produce an
            <span class="text-italic">anthroscope.</span>
            “And what”, you will certainly be asking, “is an anthroscope?”
          </p>
          <p>
            An
            <span class="text-italic">anthroscope</span>
            , like any scope (e.g., telescope, microscope, oscilloscope, etc.), is designed to give its users the capacity to view something
            with new perspective. In the case of this application, the specimen under investigation is society and that new perspective is
            the distribution and variety of opinions held within it. The prefix “anthro” being borrowed from the Greek word “anthropo”
            meaning human.
          </p>
          <p>
            To function as intended, Celebrity Fanalyzer will use modern statistics, artificial intelligence, and big data to produce
            visuals reflecting the opinion scape of any particular topic. The team collectively refers to these visuals as anthrograms.
            Anthrograms should, if done properly, make obvious the inherent biases of any
            <span class="text-bold">one</span>
            opinion and, from this new perspective, a user should be able to infer their own truth.
          </p>
          <p>
            Celebrity Fanalyzer cannot produce anthrograms in its current form. To do this, a technological solution which scrubs user data
            of all identifiers, is necessary. In fact, Celebrity Fanalyzer is one of few applications THAT DOES NOT WANT YOUR PERSONAL DATA.
            Ultimately, our goal is to launch the application behind a custom built anonymizing reverse proxy we call “Layer 8.” Once
            launched, this specialized server will scrub all personally identifying information from incoming traffic and thereby
            ireversibly separate a user's
            <i>online</i>
            identity from their
            <i>true</i>
            identity.
          </p>
          <p>
            Following the launch and debugging of Layer 8, Celebrity Fanalyzer is to be recast as a general news website entitled “Globe &
            Citizen.” Though following approximately the same mechanics as Celebrity Fanalyzer, Globe & Citizen is to be an anthroscope in
            the fullest sense: by coming preconfigured to receive only anonymized user data, it will immediately produce anthrograms that
            users will hopefully find both insightful and beautiful. Globe & Citizen, unlike Celebrity Fanalyzer, will deal with topics such
            as climate change, inflation, COVID vaccines, and much more because, for obvious reasons, the Internet needs an anthroscope.
          </p>
          <p>This is “why.”</p>
        </article>
      </section>

      <!-- *** -->

      <section class="q-my-xl text-body1 text-center" style="max-width: 100%" data-test="roadmap">
        <h3 class="text-bold text-h5">Development Roadmap</h3>
        <q-list bordered class="q-ma-md rounded-borders">
          <q-expansion-item caption="2022/23" expand-separator icon="stars" label="Build Celebrity Fanalyzer">
            <q-card>
              <q-card-section>
                Celebrity Fanalyzer is an iteration engine: give us your feedback! We try to release a new version every month. We are
                particularly interested in how to tweak contributor compensation for participating.
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-expansion-item caption="2023/24" expand-separator icon="code" label="Build Layer 8">
            <q-card>
              <q-card-section>
                Ultimately, our goal is to launch Celebrity Fanalyzer behind a custom built anonymizing reverse proxy scheduled for
                development in late 2023 that we call “Layer 8.”
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-expansion-item
            caption="2024"
            default-opened
            expand-separator
            icon="language"
            header-class="text-primary"
            label="Make it a DAPP"
          >
            <q-card>
              <q-card-section>
                Celebrity Fanalyzer is one of many projects exploring how crypto currency can be used. Our goal is to make Celebrity
                Fanalyzer a DAPP (a Distributed APPlication) by connecting it to a blockchain. Anyone with a crypto wallet should be able to
                participate in our competitions, give their opinion, and get paid if they contribute meaningfully.
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-expansion-item
            caption="2024"
            default-opened
            expand-separator
            icon="assessment"
            header-class="text-primary"
            label="Connect Celebrity Fanalyzer to Layer 8"
          >
            <q-card>
              <q-card-section>
                How to determine the definition of "better" when opinions are subjective by definition? The simplest way is to implement a
                centralized process but this, of course, means only a single perspective is represented. A decentralize model of "better" is
                necessary and this is a hard problem. Once Layer 8 is deployed, Celebrity Fanalyzer will have vast amounts of anonymous data
                to analyze freely. How to rank (and reward) authors who contribute the "best" work? The answer is to-be-determined. Give us
                your thoughts! Give us your feedback!
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-expansion-item caption="2025" expand-separator icon="rocket_launch" label="Launch Globe & Citizen">
            <q-card>
              <q-card-section>
                Deep fakes, fake media, toxic hate speech, and a consolidated media industry: this is the reality of the internet today. How
                to decentralize control of the media we consume but still provide a quality online service on par with a
                <a href="https://moxie.org/2022/01/07/web3-first-impressions.html">centralized one</a>
                ? Once Layer 8 is established, the AI ranking algorithm is open sourced, and Celebrity Fanalyzer is a successful DAPP, it’s
                finally time to launch Globe & Citizen — our answer to this question. Reach out to us if you’re interested in getting
                involved.
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </section>

      <!-- *** -->

      <section class="q-mt-xl text-body1 text-center">
        <h3 class="text-bold text-h5">Contact Us!</h3>
        <p>
          Want to communicate with the team here at Celebrity Fanalyzer? Contact us through a message on our Discord server: give an
          opinion, suggest a topic, or give feedback. We would love to hear from you! Celebrity Fanalyzer is a work in progress. If you want
          to get involved in shaping the future of the application, reach out to us via Discord:
        </p>
        <q-btn flat href="https://discord.gg/z4P3UrhhSH" icon="img:/icons/discord.svg" round size="lg" target="_blank">
          <q-tooltip anchor="bottom middle" self="center middle">Community on Discord</q-tooltip>
        </q-btn>
        <q-btn
          class="q-mx-md"
          flat
          href="https://github.com/globe-and-citizen/celebrity-fanalyzer"
          icon="img:/icons/github.svg"
          round
          size="lg"
          target="_blank"
        >
          <q-tooltip anchor="bottom middle" self="center middle">Contribute</q-tooltip>
        </q-btn>
        <q-btn data-test="terms-of-service-button" flat to="/terms-of-service" icon="local_police" round size="lg">
          <q-tooltip anchor="bottom middle" self="center middle">Terms of Service</q-tooltip>
        </q-btn>
      </section>
    </q-page>
  </q-page-container>
</template>

<script setup>
import TheHeader from 'src/components/shared/TheHeader.vue'
import { useErrorStore, usePromptStore } from 'src/stores'
import { computed, onMounted } from 'vue'

const errorStore = useErrorStore()
const promptStore = usePromptStore()

const monthPrompt = computed(() => {
  return promptStore.getMonthPrompt?.[0]
})

onMounted(async () => {
  await promptStore.fetchMonthsPrompt().catch((error) => errorStore.throwError(error, error))
})
</script>

<style scoped lang="scss">
a {
  text-decoration: none;
  transition: all 0.3s;

  &:visited {
    color: #e54757;
  }
}

.bg-blur {
  backdrop-filter: blur(60px);
}
</style>
