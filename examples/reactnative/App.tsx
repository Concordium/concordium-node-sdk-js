/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import {
    ConcordiumGRPCWebClient,
    ConcordiumHdWallet,
    displayTypeSchemaTemplate,
    getSignature,
} from '@concordium/web-sdk';
import * as ed from '@noble/ed25519';
import { Buffer } from 'buffer/';
import React from 'react';
import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import {
    Colors,
    DebugInstructions,
    Header,
    LearnMoreLinks,
    ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
    title: string;
}>;

const ADDRESS = 'https://grpc.testnet.concordium.com';
const PORT = 20000;
const WALLET_SEED =
    'c70040111e6f32891c142ce7ce35fb5e52d5c5a97e1afc5e5628f032c65c288e5fd737432910ed1870ba818025813e4bab0dff727b9b6709ae7ed1264dae3b46';

function TestSDK() {
    // WALLET
    const wallet = ConcordiumHdWallet.fromHex(WALLET_SEED, 'Testnet');

    const privateKey = wallet.getAccountSigningKey(0, 0, 0).toString('hex');
    console.log('privateKey', privateKey);
    const publicKey = wallet.getAccountPublicKey(0, 0, 0).toString('hex');
    console.log('publicKey', publicKey);
    const idCredSec = wallet.getIdCredSec(0, 0).toString('hex');
    console.log('idCredSec', idCredSec);
    const getPrfKey = wallet.getPrfKey(0, 0).toString('hex');
    console.log('getPrfKey', getPrfKey);

    // SCHEMA
    const schema = Buffer.from('FAACAAAABAAAAGtleXMQAR4gAAAADgAAAGF1eGlsaWFyeV9kYXRhEAEC', 'base64');
    console.log(schema);
    const jsonSchema = displayTypeSchemaTemplate(schema);
    console.log(jsonSchema);

    //GRPC
    const client = new ConcordiumGRPCWebClient(ADDRESS, PORT);

    // Unary calls
    client
        .getBlockInfo()
        .then((bi) => console.log('BLOCK INFO', bi))
        .catch(console.error);

    // Streaming calls
    (async () => {
        const accounts = client.getBakerList();
        console.log('ACCOUNTS', accounts);
        for await (const v of accounts) {
            console.log(v);
        }
    })().catch(console.error);

    // crypto
    const k = ed.utils.randomPrivateKey();
    const m = Buffer.from('This is a message to be signed.');
    getSignature(m, Buffer.from(k).toString('hex'))
        .then((r) => console.log('SIGNATURE', r))
        .catch((e) => console.error('ERROR', e));

    return null;
}

function Section({ children, title }: SectionProps): JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    return (
        <View style={styles.sectionContainer}>
            <Text
                style={[
                    styles.sectionTitle,
                    {
                        color: isDarkMode ? Colors.white : Colors.black,
                    },
                ]}
            >
                {title}
            </Text>
            <Text
                style={[
                    styles.sectionDescription,
                    {
                        color: isDarkMode ? Colors.light : Colors.dark,
                    },
                ]}
            >
                {children}
            </Text>
        </View>
    );
}

function App(): JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    };

    return (
        <SafeAreaView style={backgroundStyle}>
            <TestSDK />
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={backgroundStyle.backgroundColor}
            />
            <ScrollView contentInsetAdjustmentBehavior="automatic" style={backgroundStyle}>
                <Header />
                <View
                    style={{
                        backgroundColor: isDarkMode ? Colors.black : Colors.white,
                    }}
                >
                    <Section title="Step One">
                        Edit <Text style={styles.highlight}>App.tsx</Text> to change this screen and then come back to
                        see your edits.
                    </Section>
                    <Section title="See Your Changes">
                        <ReloadInstructions />
                    </Section>
                    <Section title="Debug">
                        <DebugInstructions />
                    </Section>
                    <Section title="Learn More">Read the docs to discover what to do next:</Section>
                    <LearnMoreLinks />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
    },
    highlight: {
        fontWeight: '700',
    },
});

export default App;
