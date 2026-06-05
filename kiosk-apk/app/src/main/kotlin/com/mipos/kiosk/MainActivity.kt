package com.mipos.kiosk

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * MIPOS Self Check-In kiosk shell.
 * A single full-screen WebView that loads the hosted kiosk web app, kept in an
 * immersive, always-on, hard-to-exit state for the Sunmi K2.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        web = WebView(this)
        setContentView(web)

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            useWideViewPort = true
            loadWithOverviewMode = true
            textZoom = 100
        }
        web.webChromeClient = WebChromeClient()
        web.webViewClient = WebViewClient() // keep all navigation inside the WebView
        web.addJavascriptInterface(KioskBridge(), "AndroidKiosk")
        web.loadUrl(getString(R.string.kiosk_url))
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
        // Pins the screen when the app is device-owner or task-locking is allowed.
        // No-op (caught) on un-provisioned devices — the HOME-launcher + immersive
        // mode still keep customers in the app.
        try { startLockTask() } catch (_: Exception) {}
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUI()
    }

    @Suppress("DEPRECATION")
    private fun hideSystemUI() {
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
    }

    // Hardware back never leaves the app; at most it steps back within the web flow.
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack()
    }

    /** Exposed to the web app as `AndroidKiosk`. Lets the staff-exit gesture unlock. */
    inner class KioskBridge {
        @JavascriptInterface
        fun exit(pin: String) {
            if (pin == "1988") {
                runOnUiThread {
                    try { stopLockTask() } catch (_: Exception) {}
                    finish()
                }
            }
        }
    }
}
