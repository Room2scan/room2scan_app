package com.scan2room.app

import android.app.Application
import android.content.res.Configuration
import android.util.Log

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import java.io.File
import java.io.FileOutputStream

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          override fun getPackages(): List<ReactPackage> {
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(new MyReactNativePackage());
            return PackageList(this).packages
          }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
          override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    prepareBundledRoomAssetsAsync()
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  private fun prepareBundledRoomAssetsAsync() {
    Thread {
      try {
        val assetRoot = "room2scan_local_rooms"
        val targetRoot = File(filesDir, assetRoot)
        copyAssetTree(assetRoot, targetRoot)
        Log.i("Room2Scan", "Bundled room assets are ready at ${targetRoot.absolutePath}")
      } catch (ex: Exception) {
        Log.w("Room2Scan", "Bundled room asset copy failed: ${ex.message}")
      }
    }.start()
  }

  private fun copyAssetTree(assetPath: String, target: File) {
    val children = assets.list(assetPath) ?: emptyArray()
    if (children.isEmpty()) {
      copyAssetFile(assetPath, target)
      return
    }

    if (!target.exists()) target.mkdirs()
    children.forEach { child ->
      copyAssetTree("$assetPath/$child", File(target, child))
    }
  }

  private fun copyAssetFile(assetPath: String, target: File) {
    try {
      val expectedSize = assets.open(assetPath).use { it.available().toLong() }
      if (target.exists() && target.length() == expectedSize) return

      target.parentFile?.mkdirs()
      assets.open(assetPath).use { input ->
        FileOutputStream(target).use { output ->
          input.copyTo(output)
        }
      }
    } catch (_: Exception) {
      // Missing optional bundled assets should not prevent app startup.
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
