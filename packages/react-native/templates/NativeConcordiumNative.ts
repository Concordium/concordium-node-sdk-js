// Codegen spec for SDK builds without generated native bindings.
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
    installRustCrate(): boolean;
    cleanupRustCrate(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ConcordiumNative');
