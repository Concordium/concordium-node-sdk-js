# The UniFFI adapter uses JNI symbols named after this class and its methods.
-keepclasseswithmembernames class com.concordium.sdk.reactnative.ConcordiumNativeModule {
    native <methods>;
}
