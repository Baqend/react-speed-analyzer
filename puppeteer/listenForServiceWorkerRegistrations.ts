import { CDPSession } from 'puppeteer'

export async function listenForServiceWorkerRegistrations(client: CDPSession): Promise<ServiceWorkerRegistrationMap> {
  const swRegistrations: ServiceWorkerRegistrationMap = new Map()

  await client.on('ServiceWorker.workerRegistrationUpdated', ({ registrations }) => {
    for (const registration of registrations) {
      swRegistrations.set(registration.registrationId, registration)
    }
  })

  // Collect all script URLs
  await client.on('ServiceWorker.workerVersionUpdated', ({ versions }) => {
    for (const { registrationId, scriptURL } of versions) {
      const registration = swRegistrations.get(registrationId)
      if (registration) {
        registration.scriptURL = scriptURL
      }
    }
  })

  return swRegistrations
}
