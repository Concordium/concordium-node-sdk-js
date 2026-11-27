require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'ConcordiumNative'
  s.version = package['version']
  s.summary = 'Concordium SDK native bindings for React Native'
  s.homepage = package['repository']['url']
  s.license = package['license']
  s.author = 'Concordium Software'
  s.source = { :git => package['repository']['url'], :tag => "sdk/#{s.version}" }
  s.platforms = { :ios => min_ios_version_supported }
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.source_files = 'lib/react-native/{cpp,runtime/include,ios}/**/*.{h,hpp,cpp,mm}'
    s.vendored_frameworks = 'lib/react-native/ConcordiumReactNativeFramework.xcframework'
    install_modules_dependencies(s)
  else
    s.dependency 'React-Core'
  end
end
