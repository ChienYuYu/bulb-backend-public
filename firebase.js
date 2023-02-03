const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

// const serviceAccount = require('./full-stack-dd962-firebase-adminsdk-b7g6k-083c323b03.json');
const firebaseConfig = JSON.parse(process.env.SERVICE_ACCOUNT || {});

initializeApp({
  // credential: cert(serviceAccount)
  credential: cert(firebaseConfig)
});

const db = getFirestore();

module.exports = { db };