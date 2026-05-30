// Patches the CI-generated Android project for Health Connect support:
//  • adds Health Connect <queries>, health read permissions, and the
//    permissions-rationale activity to AndroidManifest.xml
//  • bumps minSdkVersion to 26 (required by androidx.health.connect)
// Safe to run repeatedly (idempotent).
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'

const manifestPath = 'android/app/src/main/AndroidManifest.xml'
const variablesPath = 'android/variables.gradle'
const appGradlePath = 'android/app/build.gradle'
const keystoreSrc = 'vintly-debug.keystore'
const keystoreDst = 'android/app/vintly-debug.keystore'

const PERMS_AND_QUERIES = `
    <!-- Vintly: Health Connect -->
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <queries>
        <package android:name="com.google.android.apps.healthdata" />
    </queries>
`

const RATIONALE_ACTIVITY = `
        <!-- Vintly: Health Connect permissions rationale -->
        <activity android:name="com.fit_up.health.capacitor.PermissionsRationaleActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
            </intent-filter>
        </activity>
        <activity-alias android:name="ViewPermissionUsageActivity"
            android:exported="true"
            android:targetActivity="com.fit_up.health.capacitor.PermissionsRationaleActivity"
            android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
            <intent-filter>
                <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
                <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
            </intent-filter>
        </activity-alias>
`

function patchManifest() {
  if (!existsSync(manifestPath)) {
    console.log('AndroidManifest.xml not found, skipping')
    return
  }
  let m = readFileSync(manifestPath, 'utf8')
  if (m.includes('android.permission.health.READ_STEPS')) {
    console.log('Manifest already patched')
    return
  }
  // Insert rationale activities before </application>
  m = m.replace('</application>', `${RATIONALE_ACTIVITY}    </application>`)
  // Insert permissions + queries before </manifest>
  m = m.replace('</manifest>', `${PERMS_AND_QUERIES}</manifest>`)
  writeFileSync(manifestPath, m)
  console.log('Patched AndroidManifest.xml for Health Connect')
}

function patchMinSdk() {
  if (!existsSync(variablesPath)) {
    console.log('variables.gradle not found, skipping minSdk bump')
    return
  }
  let v = readFileSync(variablesPath, 'utf8')
  v = v.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 26')
  writeFileSync(variablesPath, v)
  console.log('Set minSdkVersion = 26')
}

// Use a committed, stable signing key so APK updates install over the old app
// (no uninstall needed). Applies to the debug build type automatically.
function patchSigning() {
  if (!existsSync(appGradlePath) || !existsSync(keystoreSrc)) {
    console.log('app build.gradle or keystore missing, skipping signing patch')
    return
  }
  copyFileSync(keystoreSrc, keystoreDst)
  let g = readFileSync(appGradlePath, 'utf8')
  if (g.includes('vintly-debug.keystore')) { console.log('signing already patched'); return }
  const block = `    signingConfigs {
        debug {
            storeFile file('vintly-debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {`
  g = g.replace('    buildTypes {', block)
  writeFileSync(appGradlePath, g)
  console.log('Patched app/build.gradle with stable debug signing')
}

patchManifest()
patchMinSdk()
patchSigning()
