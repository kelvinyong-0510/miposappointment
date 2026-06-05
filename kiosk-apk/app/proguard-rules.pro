# Keep the JS bridge methods reachable from WebView JavaScript.
-keepclassmembers class com.mipos.kiosk.MainActivity$KioskBridge {
    @android.webkit.JavascriptInterface <methods>;
}
