const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

const db = admin.firestore()

async function calculateTotalImpressions(advertiseDocRef) {
  const impressionsSnapshot = await advertiseDocRef.collection('impressions').get()
  let totalImpressions = 0

  impressionsSnapshot.forEach((doc) => {
    const data = doc.data()
    if (data && typeof data.impression === 'number') {
      totalImpressions += data.impression
    }
  })

  return totalImpressions
}

async function calculateTotalClicks(advertiseDocRef) {
  const clicksSnapshot = await advertiseDocRef.collection('clicks').get()
  let totalClicks = 0

  clicksSnapshot.forEach((doc) => {
    const data = doc.data()
    if (data && typeof data.clicked === 'number') {
      totalClicks += data.clicked
    }
  })

  return totalClicks
}

async function calculateTotalVisits(advertiseDocRef) {
  const visitorsSnapshot = await advertiseDocRef.collection('visitors').get()
  let totalVisits = 0

  visitorsSnapshot.forEach((doc) => {
    const data = doc.data()
    if (data && Array.isArray(data.visits)) {
      totalVisits += data.visits.length
    }
  })

  return totalVisits
}

async function calculateAmountSpent(totalClicks, totalImpressions, totalVisits) {
  return (
    import.meta.env.VITE_ADVERTISE_CLICK_RATE * totalClicks +
    import.meta.env.VITE_ADVERTISE_IMPRESSION_RATE * totalImpressions +
    import.meta.env.VITE_ADVERTISE_VIEWS_RATE * totalVisits
  )
}

async function updateAdvertiseStatus(docId) {
  const advertiseDocRef = db.collection('advertises').doc(docId)

  const docData = (await advertiseDocRef.get()).data()
  const myBudget = Number(docData.budget) ?? 0

  const totalImpressions = await calculateTotalImpressions(advertiseDocRef)
  const totalClicks = await calculateTotalClicks(advertiseDocRef)
  const totalVisits = await calculateTotalVisits(advertiseDocRef)

  const totalCost = calculateAmountSpent(totalClicks, totalImpressions, totalVisits)
  const date1 = new Date()
  const date2 = new Date(docData.endDate)
  date1.setHours(0, 0, 0, 0)
  date2.setHours(0, 0, 0, 0)
  const Difference_In_Time = date2.getTime() - date1.getTime()
  const Difference_In_Days = Math.round(Difference_In_Time / (1000 * 3600 * 24))

  let newStatus = docData.status

  if (myBudget < totalCost) {
    newStatus = 'Budget Crossed'
  } else if (Difference_In_Days < 0) {
    newStatus = 'Complete'
  }

  await advertiseDocRef.update({
    status: newStatus,
    totalClicks: totalClicks,
    totalImpressions: totalImpressions,
    totalVisits: totalVisits
  })

  console.log(`Document ${docId} updated with status: ${newStatus}`)
}

exports.onAdvertiseChange = functions.firestore.document('advertises/{docId}').onWrite(async (change, context) => {
  const docId = context.params.docId
  await updateAdvertiseStatus(docId)
})

exports.onImpressionChange = functions.firestore
  .document('advertises/{docId}/impressions/{impressionId}')
  .onWrite(async (change, context) => {
    const docId = context.params.docId
    await updateAdvertiseStatus(docId)
  })

exports.onClickChange = functions.firestore.document('advertises/{docId}/clicks/{clickId}').onWrite(async (change, context) => {
  const docId = context.params.docId
  await updateAdvertiseStatus(docId)
})

exports.onVisitorChange = functions.firestore.document('advertises/{docId}/visitors/{visitorId}').onWrite(async (change, context) => {
  const docId = context.params.docId
  await updateAdvertiseStatus(docId)
})

exports.deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.')
  }
  const { uid } = data
  try {
    await admin.auth().deleteUser(uid)
    await admin.firestore().collection('users').doc(uid).delete()
    return { message: 'User deleted successfully' }
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to delete user', error.message)
  }
})
