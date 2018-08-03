# Baqend Module API

## `analyzeUrl`

A URL normalization and detection of Speed Kit, WordPress and other CMSs. 

- **urls**: string[] | string
- **mobile?**: boolean = false

## `startComparison`

A comparison of a URL with and without Speed Kit.

- **url**: string
- **activityTimeout?**: number = 75
- **caching?**: boolean = false
- **location?**: string = 'eu-central-1-docker:Chrome.FIOSNoLatency'
- **mobile?**: boolean = false
- **priority?**: number = 0
- **skipPrewarm?**: boolean = false
- **speedKitConfig?**: string = /* default */
- **timeout?**: number = 30

## `startMultiComparison`

A comparison with multiple runs. 

- **url**: string
- **activityTimeout?**: number = 75
- **caching?**: boolean = false
- **location?**: string = 'eu-central-1-docker:Chrome.FIOSNoLatency'
- **mobile?**: boolean = false
- **priority?**: number = 0
- **skipPrewarm?**: boolean = false
- **speedKitConfig?**: string = /* default */
- **timeout?**: number = 30
- **runs?**: number = 1
- **createdBy?**: string = null

## `startBulkComparison`

A comparison of multiple URLs with multiple runs.

- **tests**: Array of
  - **url**: string
  - **activityTimeout?**: number = 75
  - **caching?**: boolean = false
  - **location?**: string = 'eu-central-1-docker:Chrome.FIOSNoLatency'
  - **mobile?**: boolean = false
  - **priority?**: number = 0
  - **skipPrewarm?**: boolean = false
  - **speedKitConfig?**: string = /* default */
  - **timeout?**: number = 30
  - **runs?**: number = 1
- **createdBy?**: string = null

_You can also just simply pass the array._
