<template>
<v-card color="#121212" class="pa-4" style="height: 93vh; display: flex; flex-direction: column;">
    <div style="height: 20px;">
    <v-toolbar color="" elevation="1" class="mb-2" >
        <v-toolbar-title class="black--text" style="font-weight: bold;">
        <v-icon left class="black--text">mdi-console</v-icon>
        Innovate Dynamics - Incident Response Terminal
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-chip :color="systemStatus.color" small class="black--text">{{ systemStatus.text }}</v-chip>
        <v-btn icon @click="handleExitClick">
        <v-icon class="black--text">mdi-close</v-icon>
        </v-btn>
    </v-toolbar>

    </div>

    <v-sheet
        class="pa-4 white--text"
        elevation="2"
        style="
        flex-grow: 1;
        overflow-y: auto;
        background-color: #1E1E1E;
        "
    >
        <div
        v-for="(entry, index) in storyLog"
        :key="index"
        class="mb-4 text-body-1 white--text"
        >
        <span class="white--text mr-3">[{{ entry.time }}]</span>
        
        <span
            class="font-weight-bold mr-2"
            :class="{
                'yellow--text text--lighten-2': entry.type === 'user',
                'blue--text text--lighten-2': entry.type === 'system',
                'red--text text--darken-2': entry.type === 'alert',
                'white--text': !entry.type || (entry.type !== 'user' && entry.type !== 'system' && entry.type !== 'alert')
            }"
        >
            {{ entry.source }}:
        </span>
        <span v-html="entry.text"></span>
        </div>
    </v-sheet>

    <v-card-actions class="pa-2" v-if="currentChoices.length > 0">
        <v-row>
        <v-col cols="12">
            <p class="font-weight-bold text-center mb-2 white--text">{{ currentPrompt }}</p>
        </v-col>

        <template v-if="!isSimulationEnd">
            <v-col
            v-for="choice in currentChoices"
            :key="choice.id"
            cols="12"
            class="mb-1"
            >
            <v-btn
                small
                block
                color="white"
                class="black--text"
                @click="makeChoice(choice.nextEventId)"
            >
                <v-icon left small class="black--text">{{ choice.icon }}</v-icon>
                {{ choice.text }}
            </v-btn>
            </v-col>
        </template>

        <v-col v-else cols="12" class="text-center">
            <v-btn
            class="ma-1"
            small
            color="primary"
            @click="makeChoice(currentChoices[0].nextEventId)"
            >
            <v-icon left small>{{ currentChoices[0].icon }}</v-icon>
            {{ currentChoices[0].text }}
            </v-btn>
            <v-btn
            class="ma-1"
            small
            color="white"
            @click="getAIDebrief"
            :loading="loadingAIDebrief"
            >
            <v-icon left small>mdi-auto-fix</v-icon>
            Generate AI-Powered Debrief 
            </v-btn>

            <v-expand-transition>
            <div v-if="aiDebrief" class="mt-2 text-left">
                <v-alert
                border="left"
                colored-border
                color="deep-purple accent-4"
                elevation="2"
                text
                class="pa-4"
                >
                <v-row align="center">
                    <v-col cols="12" md="3" class="text-center">
                    <v-progress-circular
                        :rotate="-90"
                        :size="80"
                        :width="12"
                        :value="aiDebrief.score"
                        :color="
                        aiDebrief.score >= 80
                            ? 'green'
                            : aiDebrief.score >= 50
                            ? 'orange'
                            : 'red'
                        "
                        class="white--text"
                    >
                        <strong style="font-size: 1rem;"
                        >{{ aiDebrief.score }}%</strong
                        >
                    </v-progress-circular>
                    </v-col>
                    <v-col cols="12" md="9">
                    <h4 class="mb-2 white--text" style="font-size: 1.1rem;">
                        {{ aiDebrief.headline }}
                    </h4>
                    <v-chip color="green" outlined small class="mr-1 mb-1">
                        <v-icon left small>mdi-check-circle</v-icon>
                        {{ aiDebrief.counts.good }} Correct
                    </v-chip>
                    <v-chip color="orange" outlined small class="mr-1 mb-1">
                        <v-icon left small>mdi-alert-outline</v-icon>
                        {{ aiDebrief.counts.risky }} Risky
                    </v-chip>
                    <v-chip color="red" outlined small class="mb-1">
                        <v-icon left small>mdi-close-circle</v-icon>
                        {{ aiDebrief.counts.bad }} Critical
                    </v-chip>
                    </v-col>
                </v-row>

                <v-divider
                    class="my-3"
                    style="border-color: rgba(255, 255, 255, 0.2);"
                ></v-divider>

                <div
                    v-for="(point, i) in aiDebrief.feedbackPoints"
                    :key="i"
                    class="d-flex align-start mb-2"
                >
                    <v-icon
                    :color="getDebriefColor(point.type)"
                    class="mr-2 mt-1"
                    small
                    >
                    {{ getDebriefIcon(point.type) }}
                    </v-icon>
                    <div class="white--text" style="line-height: 1.4;">
                    {{ point.text }}
                    </div>
                </div>
                </v-alert>
            </div>
            </v-expand-transition>
        </v-col>
        </v-row>
    </v-card-actions>
    </v-card>
</template>

<script>
export default {
    name: 'SimulatorTerminal',
    props: {
    scenarioType: {
        type: String,
        required: true,
    },
    },
    data() {
    return {
        storyLog: [],
        currentEventId: 'start',
        currentPrompt: '',
        currentChoices: [],
        systemStatus: { text: 'Nominal', color: 'green' },
        isSimulationEnd: false,
        loadingAIDebrief: false,
        aiDebrief: null, // This will now store an OBJECT, not a string
        narrativeTree: {},
        userDecisions: [],
        // *** DATA MODIFIED BELOW: Added 'type' property to all log entries ***
        phishingNarrativeTree: {
        'phishing_1': {
            log: [
            { time: '08:05 AM', source: 'System', text: 'New Email Alert: Urgent CEO Request', type: 'system' },
            { time: '08:06 AM', source: 'User', text: '<b>(Finance Analyst):</b> Received an email from `ceo@xyz-corp.co` requesting an urgent $15,000 wire transfer.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Forward the email to my manager', icon: 'mdi-email-send', nextEventId: 'phishing_1_risky_feedback' },
            { id: 2, text: 'Process the transfer immediately', icon: 'mdi-cash-fast', nextEventId: 'phishing_1_bad_feedback' },
            { id: 3, text: 'Verify by calling the CEO\'s office', icon: 'mdi-phone-check', nextEventId: 'phishing_1_good_feedback' }
            ]
        },
        'phishing_1_bad_feedback': {
            log: [{ time: '08:07 AM', source: 'Alert', text: 'Warning: This action has put the company in a serious financial situation. You\'ve transferred funds based on a fraudulent request, causing a direct loss.', type: 'alert' }],
            prompt: 'Scenario 1 Complete. Continue to next scenario?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_2' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'phishing_1_good_feedback': {
            log: [{ time: '08:07 AM', source: 'System', text: 'Excellent decision! By verifying through another channel, you have prevented a significant financial loss and protected the company.', type: 'system' }],
            prompt: 'Scenario 1 Complete. Continue to next scenario?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_2' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'phishing_1_risky_feedback': {
            log: [{ time: '08:07 AM', source: 'User', text: 'This is a risky choice. By keeping the fraudulent request circulating, you\'ve created a vulnerability where someone else might approve it.', type: 'user' }],
            prompt: 'Scenario 1 Complete. Continue to next scenario?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_2' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'phishing_2': {
            log: [
            { time: '09:15 AM', source: 'System', text: 'New Email Alert: Fake Document Access', type: 'system' },
            { time: '09:16 AM', source: 'User', text: '<b>(Marketing Manager):</b> An email from "OneDrive Security" with the subject "Action Required: Your Document Access is Being Revoked" has arrived. The link is suspicious.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Delete the email and assume it\'s spam', icon: 'mdi-delete-empty', nextEventId: 'phishing_2_risky_feedback' },
            { id: 2, text: 'Forward to the IT security department', icon: 'mdi-shield-plus', nextEventId: 'phishing_2_good_feedback' },
            { id: 3, text: 'Click the link and log in', icon: 'mdi-link-plus', nextEventId: 'phishing_2_bad_feedback' }
            ]
        },
        'phishing_2_bad_feedback': {
            log: [{ time: '09:17 AM', source: 'Alert', text: 'You have just given your login credentials to an attacker. This has created a severe vulnerability and compromised the company\'s marketing data.', type: 'alert' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_3' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'phishing_2_good_feedback': {
            log: [{ time: '09:17 AM', source: 'System', text: 'You\'ve made the right decision. Reporting the threat helps the security team protect the entire company from this attack.', type: 'system' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_3' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'phishing_2_risky_feedback': {
            log: [{ time: '09:17 AM', source: 'User', text: 'You avoided the trap, but the company remains vulnerable. By not reporting it, you\'ve allowed the attacker to continue targeting your colleagues.', type: 'user' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_3' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'phishing_3': {
            log: [
            { time: '10:30 AM', source: 'System', text: 'New Email Alert: Malicious HR Policy', type: 'system' },
            { time: '10:31 AM', source: 'User', text: '<b>(HR Coordinator):</b> Received an email from "XYZ Human Resources" with an attached file named `XYZ-Policy-Update.html` about a mandatory policy update.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Delete the email and report it as phishing', icon: 'mdi-delete-outline', nextEventId: 'phishing_3_good_feedback' },
            { id: 2, text: 'Download and open the HTML file', icon: 'mdi-file-download', nextEventId: 'phishing_3_bad_feedback' },
            { id: 3, text: 'Reply to the email to ask if it\'s real', icon: 'mdi-email-reply', nextEventId: 'phishing_3_risky_feedback' }
            ]
        },
        'phishing_3_bad_feedback': {
            log: [{ time: '10:32 AM', source: 'Alert', text: 'You have executed malicious code on your computer. Your system is now compromised, creating a serious problem for the network.', type: 'alert' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_4' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'phishing_3_risky_feedback': {
            log: [{ time: '10:32 AM', source: 'User', text: 'This action confirms to the attacker that your email is active, making you a target for more sophisticated attacks and creating a future vulnerability.', type: 'user' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_4' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'phishing_3_good_feedback': {
            log: [{ time: '10:32 AM', source: 'System', text: 'You made the right choice. You recognized the dangerous attachment and took the correct steps to protect the organization.', type: 'system' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_4' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'phishing_4': {
            log: [
            { time: '11:45 AM', source: 'System', text: 'New Email Alert: Voicemail Bait', type: 'system' },
            { time: '11:46 AM', source: 'User', text: '<b>(Sales Executive):</b> Received an automated email from an "e-Voicemail Service" with an attached file named `Voicemail_Playback.zip`.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Report the email to security and delete it', icon: 'mdi-shield-check', nextEventId: 'phishing_4_good_feedback' },
            { id: 2, text: 'Extract and open the file', icon: 'mdi-file-zip', nextEventId: 'phishing_4_bad_feedback' },
            { id: 3, text: 'Try calling the client\'s number directly', icon: 'mdi-phone', nextEventId: 'phishing_4_risky_feedback' }
            ]
        },
        'phishing_4_bad_feedback': {
            log: [{ time: '11:47 AM', source: 'Alert', text: 'Danger! The file you opened contained malware. Your computer and any connected network drives have been put in a high-risk situation.', type: 'alert' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_5' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'phishing_4_risky_feedback': {
            log: [{ time: '11:47 AM', source: 'User', text: 'This choice is a problem. It doesn\'t address the malicious email, and the phone number itself could be part of a different scam.', type: 'user' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_5' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'phishing_4_good_feedback': {
            log: [{ time: '11:47 AM', source: 'System', text: 'A wise decision. Treating unsolicited attachments as hostile is key to keeping the company\'s systems safe.', type: 'system' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_5' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'phishing_5': {
            log: [
            { time: '01:00 PM', source: 'System', text: 'New Email Alert: Vendor Payment Fraud', type: 'system' },
            { time: '01:01 PM', source: 'User', text: '<b>(Accounts Payable Clerk):</b> Received an email from "Global Supplies Inc." with a revised invoice requesting a change in banking information for future payments.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Call the vendor using a trusted phone number', icon: 'mdi-phone-in-talk', nextEventId: 'phishing_5_good_feedback' },
            { id: 2, text: 'Update the vendor\'s payment info and process', icon: 'mdi-cash-remove', nextEventId: 'phishing_5_bad_feedback' },
            { id: 3, text: 'Reply to the email to confirm the change', icon: 'mdi-email-sync', nextEventId: 'phishing_5_risky_feedback' }
            ]
        },
        'phishing_5_bad_feedback': {
            log: [{ time: '01:02 PM', source: 'Alert', text: 'You have sent company funds to a criminal\'s account. This action has resulted in a serious financial loss for the company.', type: 'alert' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_6' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'phishing_5_risky_feedback': {
            log: [{ time: '01:02 PM', source: 'User', text: 'You are now communicating directly with the attacker. This makes the company\'s financial systems even more vulnerable to fraud.', type: 'user' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_6' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'phishing_5_good_feedback': {
            log: [{ time: '01:02 PM', source: 'System', text: 'You made the right decision. Your vigilance has prevented a fraudulent payment and protected the company\'s assets.', type: 'system' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_6' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'phishing_6': {
            log: [
            { time: '02:20 PM', source: 'System', text: 'New Email Alert: Developer Credential Phish', type: 'system' },
            { time: '02:21 PM', source: 'User', text: '<b>(Junior Developer):</b> Received an email from "Git-Hub Notifications" (notify@github.org) claiming a failed code push and asking him to re-authenticate.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Ask a senior developer', icon: 'mdi-account-supervisor', nextEventId: 'phishing_6_risky_feedback' },
            { id: 2, text: 'Click the link and enter his credentials', icon: 'mdi-link-lock', nextEventId: 'phishing_6_bad_feedback' },
            { id: 3, text: 'Report the email and check the official site directly', icon: 'mdi-check-circle-outline', nextEventId: 'phishing_6_good_feedback' }
            ]
        },
        'phishing_6_bad_feedback': {
            log: [{ time: '02:22 PM', source: 'Alert', text: 'You\'ve created a massive problem. Attackers now have access to the company\'s source code.', type: 'alert' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_7' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'phishing_6_good_feedback': {
            log: [{ time: '02:22 PM', source: 'System', text: 'Excellent choice. You spotted the fake domains and protected valuable company intellectual property.', type: 'system' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_7' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'phishing_6_risky_feedback': {
            log: [{ time: '02:22 PM', source: 'User', text: 'This action created an unnecessary delay. The threat remains active on the network until it is properly reported to the security team.', type: 'user' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_7' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'phishing_7': {
            log: [
            { time: '03:10 PM', source: 'System', text: 'New Email Alert: Fake Delivery Attempt', type: 'system' },
            { time: '03:11 PM', source: 'User', text: '<b>(Logistics Specialist):</b> An email from "DHL Express" says a package delivery failed and asks him to download a file named `SHIPPING_LABEL_84723.exe`.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Report the email to IT as phishing', icon: 'mdi-bug-check', nextEventId: 'phishing_7_good_feedback' },
            { id: 2, text: 'Download and run the .exe file', icon: 'mdi-download-circle', nextEventId: 'phishing_7_bad_feedback' },
            { id: 3, text: 'Delete the email immediately', icon: 'mdi-delete-forever', nextEventId: 'phishing_7_risky_feedback' }
            ]
        },
        'phishing_7_bad_feedback': {
            log: [{ time: '03:12 PM', source: 'Alert', text: 'Critical error. You have likely installed ransomware on your machine, putting the entire company network at risk.', type: 'alert' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_8' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'phishing_7_risky_feedback': {
            log: [{ time: '03:12 PM', source: 'User', text: 'You protected yourself, but you\'ve left your colleagues vulnerable. The security team is now blind to an active attack.', type: 'user' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_8' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'phishing_7_good_feedback': {
            log: [{ time: '03:12 PM', source: 'System', text: 'You\'ve made the right decision. Identifying and reporting a malicious executable is a critical security action that protects everyone.', type: 'system' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_8' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'phishing_8': {
            log: [
            { time: '04:05 PM', source: 'System', text: 'New Email Alert: Misspelled Security Alert', type: 'system' },
            { time: '04:06 PM', source: 'User', text: '<b>(IT Helpdesk):</b> Received a security alert from "Microsoft account team" about an unusual sign-in. The link points to `microsft-login.com`.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Change your password via the official portal', icon: 'mdi-form-textbox-password', nextEventId: 'phishing_8_risky_feedback' },
            { id: 2, text: 'Click the link to check the activity', icon: 'mdi-link', nextEventId: 'phishing_8_bad_feedback' },
            { id: 3, text: 'Forward the email to the security team', icon: 'mdi-security', nextEventId: 'phishing_8_good_feedback' }
            ]
        },
        'phishing_8_bad_feedback': {
            log: [{ time: '04:07 PM', source: 'Alert', text: 'Your account is now compromised. By entering your credentials, you have created a serious data breach.', type: 'alert' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_9' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'phishing_8_good_feedback': {
            log: [{ time: '04:07 PM', source: 'System', text: 'Good choice. Escalating the suspicious email to the security team is the correct protocol and keeps the company safe.', type: 'system' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_9' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'phishing_8_risky_feedback': {
            log: [{ time: '04:07 PM', source: 'User', text: 'While a good instinct, this action is a problem because the threat was not reported. The attack can continue against others.', type: 'user' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_9' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'phishing_9': {
            log: [
            { time: '05:15 PM', source: 'System', text: 'New Email Alert: Account Suspension Scare', type: 'system' },
            { time: '05:16 PM', source: 'User', text: '<b>(Project Manager):</b> Received an email from "Zoom Support" (support@zoom-us.co) claiming her account has been suspended for a terms of service violation and providing a link to appeal.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Ignore the email and create a new meeting link', icon: 'mdi-account-off', nextEventId: 'phishing_9_risky_feedback' },
            { id: 2, text: 'Log in via the link to appeal', icon: 'mdi-account-cancel', nextEventId: 'phishing_9_bad_feedback' },
            { id: 3, text: 'Contact internal IT to check the account status', icon: 'mdi-handshake', nextEventId: 'phishing_9_good_feedback' }
            ]
        },
        'phishing_9_bad_feedback': {
            log: [{ time: '05:17 PM', source: 'Alert', text: 'Your account credentials have been stolen. This has made the company vulnerable, as attackers can now use your identity to launch other attacks.', type: 'alert' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_10' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'phishing_9_good_feedback': {
            log: [{ time: '05:17 PM', source: 'System', text: 'You made the right decision. Using trusted internal resources to verify an external claim is a smart and safe move.', type: 'system' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_10' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'phishing_9_risky_feedback': {
            log: [{ time: '05:17 PM', source: 'User', text: 'This choice leaves the threat unreported and creates a vulnerability. The next employee to receive this email might fall for it.', type: 'user' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'phishing_10' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'phishing_10': {
            log: [
            { time: '06:00 PM', source: 'System', text: 'New Email Alert: Tax Refund Scam', type: 'system' },
            { time: '06:01 PM', source: 'User', text: '<b>(Finance Analyst):</b> Received an email from "IRS Tax Services" (refund@irs.gov.net) informing her she is eligible for a tax refund and asking her to click a link to claim it.', type: 'user' }
            ],
            prompt: 'This is the final scenario. What is your correct action?',
            choices: [
            { id: 1, text: 'Check the official IRS website', icon: 'mdi-web', nextEventId: 'phishing_end_risky' },
            { id: 2, text: 'Click the link to provide details', icon: 'mdi-account-cash', nextEventId: 'phishing_end_bad' },
            { id: 3, text: 'Report the email as a phishing attempt', icon: 'mdi-shield-check', nextEventId: 'phishing_end_good' }
            ]
        },
        'phishing_end_bad': {
            log: [{ time: '06:02 PM', source: 'Alert', text: 'You have given sensitive personal and financial information to criminals. This puts both you and the company at high risk for fraud.', type: 'alert' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'phishing_end_good': {
            log: [{ time: '06:02 PM', source: 'System', text: 'A perfect response. You correctly identified the scam and took the right steps to protect sensitive information.', type: 'system' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'phishing_end_risky': {
            log: [{ time: '06:02 PM', source: 'User', text: 'This is not the best choice. While you didn\'t fall for the trap, your failure to report the attack leaves the company vulnerable.', type: 'user' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Compromised', color: 'orange' }
        }
        },
        ransomwareNarrativeTree: {
        'ransomware_1': {
            log: [
            { time: '09:00 AM', source: 'System', text: 'New Help Desk Ticket: Ransomware infection reported on a Finance workstation.', type: 'system' },
            { time: '09:01 AM', source: 'User', text: '<b>(IT Help Desk Specialist):</b> A ticket is raised by a frantic employee in the finance department. Their primary workstation is displaying a large, ominous message demanding a cryptocurrency payment to unlock their files, complete with a countdown timer. They also report that all of their filenames have been changed to a strange, unreadable extension.', type: 'user' }
            ],
            prompt: 'What is your immediate response?',
            choices: [
            { id: 1, text: 'Ask the user to run a full antivirus scan.', icon: 'mdi-virus-scan', nextEventId: 'ransomware_1_risky_feedback' },
            { id: 2, text: 'Instruct user to disconnect PC from the network.', icon: 'mdi-lan-disconnect', nextEventId: 'ransomware_1_good_feedback' },
            { id: 3, text: 'Suggest paying the small ransom for quick recovery.', icon: 'mdi-bitcoin', nextEventId: 'ransomware_1_bad_feedback' }
            ]
        },
        'ransomware_1_good_feedback': {
            log: [{ time: '09:02 AM', source: 'System', text: 'Isolating the PC prevents the ransomware from spreading. This is the critical first step.', type: 'system' }],
            prompt: 'Scenario 1 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_2' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'ransomware_1_bad_feedback': {
            log: [{ time: '09:02 AM', source: 'Alert', text: 'Paying the ransom is not recommended as it doesn\'t guarantee file recovery and encourages more attacks.', type: 'alert' }],
            prompt: 'Scenario 1 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_2' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'ransomware_1_risky_feedback': {
            log: [{ time: '09:02 AM', source: 'User', text: 'The priority is containment. Scanning while connected could allow the malware to spread.', type: 'user' }],
            prompt: 'Scenario 1 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_2' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'ransomware_2': {
            log: [
            { time: '10:15 AM', source: 'System', text: 'Network Anomaly Alert: High-volume traffic targeting file server.', type: 'system' },
            { time: '10:16 AM', source: 'User', text: '<b>(Network Administrator):</b> While reviewing overnight network logs, you notice a significant anomaly. There is unusual, high-volume traffic originating from multiple workstations and targeting a critical file-sharing server. This activity occurred outside of normal business hours and the traffic pattern is consistent with rapid, systematic file encryption.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Reboot the file server to stop the connections.', icon: 'mdi-server-off', nextEventId: 'ransomware_2_risky_feedback' },
            { id: 2, text: 'Keep monitoring to gather more data before acting.', icon: 'mdi-monitor-eye', nextEventId: 'ransomware_2_bad_feedback' },
            { id: 3, text: 'Isolate the affected network subnet immediately.', icon: 'mdi-network-off', nextEventId: 'ransomware_2_good_feedback' }
            ]
        },
        'ransomware_2_good_feedback': {
            log: [{ time: '10:17 AM', source: 'System', text: 'Network segmentation is a highly effective way to stop ransomware\'s lateral movement.', type: 'system' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_3' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'ransomware_2_bad_feedback': {
            log: [{ time: '10:17 AM', source: 'Alert', text: 'Delaying action allows the ransomware to encrypt more files and spread. Speed is critical.', type: 'alert' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_3' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'ransomware_2_risky_feedback': {
            log: [{ time: '10:17 AM', source: 'User', text: 'Rebooting is a temporary fix; the ransomware will likely resume on startup and cause downtime.', type: 'user' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_3' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'ransomware_3': {
            log: [
            { time: '11:00 AM', source: 'System', text: 'EDR Alert: Mass file modification and shadow copy deletion detected.', type: 'system' },
            { time: '11:01 AM', source: 'User', text: '<b>(Cybersecurity Analyst):</b> A high-priority alert fires from your Endpoint Detection and Response (EDR) platform. The alert flags a suspicious process on an executive\'s laptop that is rapidly deleting all volume shadow copies, a common tactic to prevent easy file restoration. This action is immediately followed by alerts for mass file modification across the user\'s local drive.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Close the alert, assuming it\'s a false positive.', icon: 'mdi-alert-off', nextEventId: 'ransomware_3_risky_feedback' },
            { id: 2, text: 'Use the EDR tool to isolate the laptop from the network.', icon: 'mdi-laptop-off', nextEventId: 'ransomware_3_good_feedback' },
            { id: 3, text: 'Email the executive to ask about unusual file operations.', icon: 'mdi-email-outline', nextEventId: 'ransomware_3_bad_feedback' }
            ]
        },
        'ransomware_3_good_feedback': {
            log: [{ time: '11:02 AM', source: 'System', text: 'Endpoint isolation stops the attack in its tracks and prevents it from spreading.', type: 'system' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_4' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'ransomware_3_bad_feedback': {
            log: [{ time: '11:02 AM', source: 'Alert', text: 'Contacting the user is slow and wastes valuable containment time.', type: 'alert' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_4' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'ransomware_3_risky_feedback': {
            log: [{ time: '11:02 AM', source: 'User', text: 'Deleting shadow copies is a classic ransomware tactic. Ignoring this is a severe mistake.', type: 'user' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_4' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'ransomware_4': {
            log: [
            { time: '12:30 PM', source: 'System', text: 'Database encrypted. Business application is offline.', type: 'system' },
            { time: '12:31 PM', source: 'User', text: '<b>(Backup & Recovery Specialist):</b> You\'ve just been notified that a critical production database server has been encrypted by ransomware, halting a key business application. The executive team is demanding an immediate recovery timeline. Fortunately, your most recent backups are stored on a separate, air-gapped system, theoretically safe from the attack.', type: 'user' }
            ],
            prompt: 'What is the correct recovery strategy?',
            choices: [
            { id: 1, text: 'Suggest negotiating the ransom as it might be faster.', icon: 'mdi-handshake-right', nextEventId: 'ransomware_4_risky_feedback' },
            { id: 2, text: 'Restore the latest backup to the infected server now.', icon: 'mdi-database-refresh', nextEventId: 'ransomware_4_bad_feedback' },
            { id: 3, text: 'Verify latest backup, then restore to a new clean server.', icon: 'mdi-database-check', nextEventId: 'ransomware_4_good_feedback' }
            ]
        },
        'ransomware_4_good_feedback': {
            log: [{ time: '12:32 PM', source: 'System', text: 'Verifying backups and restoring to a clean environment prevents reinfection.', type: 'system' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_5' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'ransomware_4_bad_feedback': {
            log: [{ time: '12:32 PM', source: 'Alert', text: 'Restoring to an infected server is risky; the ransomware could re-encrypt the files.', type: 'alert' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_5' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'ransomware_4_risky_feedback': {
            log: [{ time: '12:32 PM', source: 'User', text: 'Your role is recovery. Suggesting negotiation undermines the backup strategy.', type: 'user' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_5' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'ransomware_5': {
            log: [
            { time: '01:45 PM', source: 'System', text: 'Multiple users report ransomware symptoms after a phishing incident.', type: 'system' },
            { time: '01:46 PM', source: 'User', text: '<b>(IT Manager):</b> You receive a report that multiple users in the marketing department fell for a sophisticated phishing email and downloaded what they thought was a \'new marketing brochure\'. Shortly after, they all began reporting that they are unable to access their local files and network shares, describing symptoms of a ransomware infection.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Email all staff warning them about the phishing email.', icon: 'mdi-email-alert-outline', nextEventId: 'ransomware_5_risky_feedback' },
            { id: 2, text: 'Activate the official Incident Response Plan immediately.', icon: 'mdi-book-multiple', nextEventId: 'ransomware_5_good_feedback' },
            { id: 3, text: 'Assign individual help desk tickets for each user.', icon: 'mdi-ticket-account', nextEventId: 'ransomware_5_bad_feedback' }
            ]
        },
        'ransomware_5_good_feedback': {
            log: [{ time: '01:47 PM', source: 'System', text: 'A coordinated response is essential when multiple users are compromised.', type: 'system' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_6' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'ransomware_5_bad_feedback': {
            log: [{ time: '01:47 PM', source: 'Alert', text: 'Treating these as isolated incidents will lead to a slow and ineffective response.', type: 'alert' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_6' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'ransomware_5_risky_feedback': {
            log: [{ time: '01:47 PM', source: 'User', text: 'A warning email should be part of the larger incident response, not the only action.', type: 'user' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_6' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'ransomware_6': {
            log: [
            { time: '02:30 PM', source: 'System', text: 'Alert: New unauthorized Domain Admin account detected.', type: 'system' },
            { time: '02:31 PM', source: 'User', text: '<b>(System Administrator):</b> A real-time monitoring tool sends a critical alert for the creation of a new, unauthorized domain administrator account named "TEMP_ADMIN". Just moments later, a flood of alerts begin triggering from your file servers, indicating widespread and rapid file encryption is in progress.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Check IT tickets for a legitimate change request.', icon: 'mdi-file-find', nextEventId: 'ransomware_6_risky_feedback' },
            { id: 2, text: 'Remotely log off the "TEMP_ADMIN" account.', icon: 'mdi-logout', nextEventId: 'ransomware_6_bad_feedback' },
            { id: 3, text: 'Disable the new admin account and reset all other admin passwords.', icon: 'mdi-account-off', nextEventId: 'ransomware_6_good_feedback' }
            ]
        },
        'ransomware_6_good_feedback': {
            log: [{ time: '02:32 PM', source: 'System', text: 'Disabling the unauthorized account and resetting credentials helps reclaim control.', type: 'system' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_7' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'ransomware_6_bad_feedback': {
            log: [{ time: '02:32 PM', source: 'Alert', text: 'Simply logging off is not enough; the attacker still has the credentials. The account must be disabled.', type: 'alert' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_7' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'ransomware_6_risky_feedback': {
            log: [{ time: '02:32 PM', source: 'User', text: 'The context demands immediate security action, not procedural checks that waste time.', type: 'user' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_7' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'ransomware_7': {
            log: [
            { time: '03:45 PM', source: 'System', text: 'SIEM Incident Alert: Unauthorized server access and security logging disabled.', type: 'system' },
            { time: '03:46 PM', source: 'User', text: '<b>(Security Operations Center (SOC) Analyst):</b> Your SIEM (Security Information and Event Management) system correlates several suspicious events into a single high-priority incident. It shows hundreds of failed login attempts on a server, followed by a single successful login using a non-interactive service account. Immediately after, a PowerShell script was executed that disabled all security event logging on the machine.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Escalate to Tier 2 without taking immediate action.', icon: 'mdi-arrow-up-bold', nextEventId: 'ransomware_7_risky_feedback' },
            { id: 2, text: 'Isolate the server, disable the account, and investigate the script.', icon: 'mdi-server-network-off', nextEventId: 'ransomware_7_good_feedback' },
            { id: 3, text: 'Run a script to re-enable the security logging.', icon: 'mdi-script-text', nextEventId: 'ransomware_7_bad_feedback' }
            ]
        },
        'ransomware_7_good_feedback': {
            log: [{ time: '03:47 PM', source: 'System', text: 'This comprehensive approach contains the threat, removes access, and starts the investigation.', type: 'system' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_8' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'ransomware_7_bad_feedback': {
            log: [{ time: '03:47 PM', source: 'Alert', text: 'The attacker still has control and can disable it again. Containment is the priority.', type: 'alert' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_8' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'ransomware_7_risky_feedback': {
            log: [{ time: '03:47 PM', source: 'User', text: 'This is a critical threat. A Tier 1 analyst must take immediate containment actions before escalating.', type: 'user' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_8' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'ransomware_8': {
            log: [
            { time: '04:15 PM', source: 'System', text: 'Cloud Alert: S3 bucket versioning disabled.', type: 'system' },
            { time: '04:16 PM', source: 'User', text: '<b>(Cloud Security Engineer):</b> You receive an automated alert that an S3 bucket\'s object versioning policy, a key data protection feature, has been disabled. This is quickly followed by a storm of API call alerts indicating the mass deletion and subsequent re-upload of objects, all with a new, encrypted file extension.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Open a critical support ticket with AWS.', icon: 'mdi-cloud-alert', nextEventId: 'ransomware_8_bad_feedback' },
            { id: 2, text: 'Revoke the access key, re-enable versioning, and restore previous versions.', icon: 'mdi-cloud-lock', nextEventId: 'ransomware_8_good_feedback' },
            { id: 3, text: 'Snapshot the S3 bucket for forensic analysis.', icon: 'mdi-folder-search-outline', nextEventId: 'ransomware_8_risky_feedback' }
            ]
        },
        'ransomware_8_good_feedback': {
            log: [{ time: '04:17 PM', source: 'System', text: 'This stops the attack and provides an immediate path to data recovery.', type: 'system' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_9' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'ransomware_8_risky_feedback': {
            log: [{ time: '04:17 PM', source: 'User', text: 'Forensics are important, but stopping the attack and restoring data is the first priority.', type: 'user' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_9' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'ransomware_8_bad_feedback': {
            log: [{ time: '04:17 PM', source: 'Alert', text: 'You have the tools to act immediately. Waiting for support causes unnecessary delays.', type: 'alert' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_9' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'ransomware_9': {
            log: [
            { time: '05:00 PM', source: 'System', text: 'Incident contained. Investigation is now focused on data exfiltration.', type: 'system' },
            { time: '05:01 PM', source: 'User', text: '<b>(Forensics Investigator):</b> The initial ransomware attack has been successfully contained, and recovery efforts are underway. However, management is now concerned about a double-extortion threat and needs to know if any sensitive data was exfiltrated before it was encrypted. A system has been identified as Patient Zero for your investigation.', type: 'user' }
            ],
            prompt: 'What is the correct action to take?',
            choices: [
            { id: 1, text: 'Search the dark web for a public decryptor tool.', icon: 'mdi-web-box', nextEventId: 'ransomware_9_risky_feedback' },
            { id: 2, text: 'Analyze network logs for large, unusual outbound data transfers.', icon: 'mdi-file-search', nextEventId: 'ransomware_9_good_feedback' },
            { id: 3, text: 'Recommend wiping the machine to get the user back online.', icon: 'mdi-harddisk', nextEventId: 'ransomware_9_bad_feedback' }
            ]
        },
        'ransomware_9_good_feedback': {
            log: [{ time: '05:02 PM', source: 'System', text: 'Network logs are the primary evidence of data exfiltration and are key to determining the breach\'s scope.', type: 'system' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_10' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'ransomware_9_risky_feedback': {
            log: [{ time: '05:02 PM', source: 'User', text: 'This is part of recovery, not the forensic investigation into data theft.', type: 'user' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_10' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'ransomware_9_bad_feedback': {
            log: [{ time: '05:02 PM', source: 'Alert', text: 'Wiping the machine would destroy critical forensic evidence.', type: 'alert' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'ransomware_10' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'ransomware_10': {
            log: [
            { time: '06:30 PM', source: 'System', text: 'Major Incident Alert: Widespread ransomware and press inquiry received.', type: 'system' },
            { time: '06:31 PM', source: 'User', text: '<b>(Chief Information Security Officer (CISO)):</b> The situation is critical. A widespread ransomware attack has successfully impacted 30% of your company\'s systems, including key production servers. The attackers are demanding a $5 million ransom, and you\'ve just received a call from your PR department that a major tech news outlet has been tipped off and is asking for a comment.', type: 'user' }
            ],
            prompt: 'What is your recommendation to the CEO?',
            choices: [
            { id: 1, text: 'Advise the CEO to deny any security incident publicly.', icon: 'mdi-alert-circle-outline', nextEventId: 'ransomware_end_risky' },
            { id: 2, text: 'Advise CEO against payment; focus on recovery and transparent communication.', icon: 'mdi-security-plus', nextEventId: 'ransomware_end_good' },
            { id: 3, text: 'Recommend paying the ransom to get systems back online quickly.', icon: 'mdi-currency-usd-off', nextEventId: 'ransomware_end_bad' }
            ]
        },
        'ransomware_end_good': {
            log: [{ time: '06:32 PM', source: 'System', text: 'This aligns with industry best practices, focuses on structured recovery, and manages the crisis professionally.', type: 'system' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'ransomware_end_bad': {
            log: [{ time: '06:32 PM', source: 'Alert', text: 'Paying is a short-term fix with long-term negative consequences, including encouraging future attacks.', type: 'alert' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'ransomware_end_risky': {
            log: [{ time: '06:32 PM', source: 'User', text: 'Denying a public incident destroys trust. Transparency is key to crisis management.', type: 'user' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Compromised', color: 'orange' }
        }
        },
        insiderNarrativeTree: {
        'insider_1': {
            log: [
            { time: '09:00 AM', source: 'System', text: 'HR notification: Immediate termination of a database administrator.', type: 'system' },
            { time: '09:01 AM', source: 'User', text: '<b>(HR Manager):</b> You are processing the immediate termination of a database administrator. During the meeting, they became visibly angry and made a veiled comment about \'how much this company depends on them.\' Per standard procedure, their system access is scheduled for automatic revocation at 5:00 PM, which is still several hours away.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Attempt to de-escalate the situation by counseling them.', icon: 'mdi-account-supervisor-outline', nextEventId: 'insider_1_risky_feedback' },
            { id: 2, text: 'Escort the employee out and have IT revoke access now.', icon: 'mdi-account-off', nextEventId: 'insider_1_good_feedback' },
            { id: 3, text: 'Allow the employee to finish the day as planned.', icon: 'mdi-clock-time-four-outline', nextEventId: 'insider_1_bad_feedback' }
            ]
        },
        'insider_1_good_feedback': {
            log: [{ time: '09:02 AM', source: 'System', text: 'This swift action protects company data. By immediately revoking access, you have neutralized the threat posed by a disgruntled employee with privileged credentials, preventing potential sabotage.', type: 'system' }],
            prompt: 'Scenario 1 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_2' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'insider_1_bad_feedback': {
            log: [{ time: '09:02 AM', source: 'Alert', text: 'This decision puts company assets at severe risk. You\'ve given a disgruntled insider with high-level privileges several hours of unsupervised access to critical systems, creating a window for data theft or sabotage.', type: 'alert' }],
            prompt: 'Scenario 1 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_2' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'insider_1_risky_feedback': {
            log: [{ time: '09:02 AM', source: 'User', text: 'This action fails to address the immediate security risk. While de-escalation is important, leaving their system access active allows the disgruntled employee to potentially harm the company\'s digital assets while you are talking.', type: 'user' }],
            prompt: 'Scenario 1 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_2' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'insider_2': {
            log: [
            { time: '10:30 AM', source: 'System', text: 'DLP Alert: Unauthorized data exfiltration attempt.', type: 'system' },
            { time: '10:31 AM', source: 'User', text: '<b>(Data Loss Prevention (DLP) Analyst):</b> You receive a high-severity DLP alert indicating that a user in the Sales department has attempted to upload a large file named \'Q4_All_Client_Contacts.xlsx\' to their personal, non-approved cloud storage account. The DLP tool automatically blocked the transfer, but this is the third such attempt from this user in the last month, each to a different unauthorized site.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Email the user asking for a business justification.', icon: 'mdi-email-outline', nextEventId: 'insider_2_bad_feedback' },
            { id: 2, text: 'Block and escalate the incident to the user\'s manager.', icon: 'mdi-account-cancel', nextEventId: 'insider_2_good_feedback' },
            { id: 3, text: 'Whitelist the site to avoid future false positives.', icon: 'mdi-check-circle-outline', nextEventId: 'insider_2_risky_feedback' }
            ]
        },
        'insider_2_good_feedback': {
            log: [{ time: '10:32 AM', source: 'System', text: 'This is the appropriate response. The immediate threat was blocked by the tool, and escalating allows management to investigate the user\'s repeated attempts to exfiltrate sensitive company data.', type: 'system' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_3' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'insider_2_bad_feedback': {
            log: [{ time: '10:32 AM', source: 'Alert', text: 'This action compromises the investigation. By contacting the user directly, you have alerted a potentially malicious insider, who may now attempt to cover their tracks or use a more sophisticated method to steal data.', type: 'alert' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_3' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'insider_2_risky_feedback': {
            log: [{ time: '10:32 AM', source: 'User', text: 'This decision creates a major security vulnerability. Whitelisting an unauthorized site bypasses company policy and effectively creates an approved channel for data theft, not just for this user but for everyone.', type: 'user' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_3' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'insider_3': {
            log: [
            { time: '11:45 AM', source: 'System', text: 'EDR Alert: Unauthorized network scanning detected.', type: 'system' },
            { time: '11:46 AM', source: 'User', text: '<b>(Cybersecurity Analyst):</b> A high-fidelity EDR alert flags that a software developer has compiled and executed a network port scanner from their company-issued laptop. The tool is actively probing the company\'s internal financial servers, an action that is far outside their normal job responsibilities and has no associated change ticket.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Message the developer and ask what they are doing.', icon: 'mdi-message-text-outline', nextEventId: 'insider_3_bad_feedback' },
            { id: 2, text: 'Ignore the alert, assuming it is authorized testing.', icon: 'mdi-eye-off', nextEventId: 'insider_3_risky_feedback' },
            { id: 3, text: 'Isolate the developer\'s machine and open an investigation.', icon: 'mdi-laptop-off', nextEventId: 'insider_3_good_feedback' }
            ]
        },
        'insider_3_good_feedback': {
            log: [{ time: '11:47 AM', source: 'System', text: 'You have effectively contained a potential attack. Internal reconnaissance is a serious threat indicator, and isolating the machine prevents any further malicious activity while a formal investigation begins.', type: 'system' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_4' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'insider_3_bad_feedback': {
            log: [{ time: '11:47 AM', source: 'Alert', text: 'This alerts the potential attacker and gives them a chance to hide their activity. This type of unauthorized behavior is a direct policy violation and must be handled through a formal security investigation, not an informal chat.', type: 'alert' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_4' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'insider_3_risky_feedback': {
            log: [{ time: '11:47 AM', source: 'User', text: 'You have ignored a critical indicator of an internal threat. Unauthorized scanning of sensitive servers is never acceptable and could be the first stage of a serious attack against the company\'s financial systems.', type: 'user' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_4' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'insider_4': {
            log: [
            { time: '01:00 PM', source: 'System', text: 'Phone Call Alert: Password reset request from an unverified source.', type: 'system' },
            { time: '01:01 PM', source: 'User', text: '<b>(IT Help Desk Specialist):</b> You receive a phone call from someone claiming to be a new remote executive who needs an immediate password reset for a critical board meeting. They sound flustered and can\'t provide their employee ID or manager\'s name, pressuring you to bypass the standard identity verification process \'just this once\'.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Ask them common security questions from their file.', icon: 'mdi-account-question', nextEventId: 'insider_4_risky_feedback' },
            { id: 2, text: 'Set a temporary password to be helpful and resolve the issue.', icon: 'mdi-account-plus', nextEventId: 'insider_4_bad_feedback' },
            { id: 3, text: 'Deny the request and follow standard ID verification protocol.', icon: 'mdi-account-check', nextEventId: 'insider_4_good_feedback' }
            ]
        },
        'insider_4_good_feedback': {
            log: [{ time: '01:02 PM', source: 'System', text: 'You have protected a user\'s account from a potential takeover. By adhering to the identity verification policy, you have thwarted a classic social engineering attempt, even under pressure.', type: 'system' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_5' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'insider_4_bad_feedback': {
            log: [{ time: '01:02 PM', source: 'Alert', text: 'This action results in a security breach. You have handed over control of an executive\'s account to an unverified person, potentially exposing sensitive company strategy and communications to an attacker.', type: 'alert' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_5' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'insider_4_risky_feedback': {
            log: [{ time: '01:02 PM', source: 'User', text: 'This is an insecure practice. Skilled social engineers often gather personal information from public sources like social media to defeat basic security questions. Only strict protocol-based verification is reliable.', type: 'user' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_5' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'insider_5': {
            log: [
            { time: '02:30 PM', source: 'System', text: 'Security Audit Alert: Anomalous privileged account activity.', type: 'system' },
            { time: '02:31 PM', source: 'User', text: '<b>(Database Administrator):</b> During a routine audit, you discover that your own highly privileged DBA service account was used at 3:00 AM to query and export the entire employee salary table to a CSV file. You were not working at that time, and this action does not correspond to any scheduled backup or maintenance job you are aware of.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Investigate the activity yourself before reporting it.', icon: 'mdi-magnify-scan', nextEventId: 'insider_5_bad_feedback' },
            { id: 2, text: 'Do nothing, assuming it was a forgotten backup job.', icon: 'mdi-sleep', nextEventId: 'insider_5_risky_feedback' },
            { id: 3, text: 'Report the compromise to security and rotate the password.', icon: 'mdi-lock-reset', nextEventId: 'insider_5_good_feedback' }
            ]
        },
        'insider_5_good_feedback': {
            log: [{ time: '02:32 PM', source: 'System', text: 'You have taken the correct steps to mitigate a serious breach. Immediately reporting a compromised privileged account and rotating its credentials are critical to stopping further unauthorized access to sensitive data.', type: 'system' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_6' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'insider_5_bad_feedback': {
            log: [{ time: '02:32 PM', source: 'Alert', text: 'This decision delays a critical security response. Investigating your own compromised account is a conflict of interest and wastes valuable time that an attacker could use to escalate their access or exfiltrate more data.', type: 'alert' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_6' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'insider_5_risky_feedback': {
            log: [{ time: '02:32 PM', source: 'User', text: 'Your negligence has left a critical system exposed. Exporting the entire salary table is highly irregular and a clear indicator of compromise. Ignoring it allows an attacker to maintain access with a powerful account.', type: 'user' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_6' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'insider_6': {
            log: [
            { time: '04:00 PM', source: 'System', text: 'VPN Log Alert: Active VPN from an unexpected location.', type: 'system' },
            { time: '04:01 PM', source: 'User', text: '<b>(IT Auditor):</b> During a quarterly review of VPN logs, you find a highly anomalous entry. A senior partner in the legal department, who is on a well-publicized vacation in Hawaii, has an active VPN connection. The connection\'s source IP address originates from Eastern Europe, a region XYZ Corp has no business in.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Wait until the user returns from vacation to ask them.', icon: 'mdi-airplane-takeoff', nextEventId: 'insider_6_risky_feedback' },
            { id: 2, text: 'Email the user asking if they are accessing the VPN.', icon: 'mdi-email-outline', nextEventId: 'insider_6_bad_feedback' },
            { id: 3, text: 'Immediately disable the user\'s VPN access and report it.', icon: 'mdi-vpn-off', nextEventId: 'insider_6_good_feedback' }
            ]
        },
        'insider_6_good_feedback': {
            log: [{ time: '04:02 PM', source: 'System', text: 'You have acted decisively to protect the network. The evidence points to a compromised account, and immediately severing the connection prevents an attacker from moving laterally or stealing sensitive legal data.', type: 'system' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_7' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'insider_6_bad_feedback': {
            log: [{ time: '04:02 PM', source: 'Alert', text: 'This action could alert the attacker without stopping them. If the account is compromised, the attacker controlling the email inbox will see your message and know they have been detected, prompting them to act faster.', type: 'alert' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_7' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'insider_6_risky_feedback': {
            log: [{ time: '04:02 PM', source: 'User', text: 'This inaction poses a severe threat to the company. Allowing a potentially malicious actor from a high-risk country to maintain VPN access for days or weeks could lead to a catastrophic data breach.', type: 'user' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_7' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'insider_7': {
            log: [
            { time: '05:15 PM', source: 'System', text: 'UEBA Alert: Anomalous file access by a trusted user.', type: 'system' },
            { time: '05:16 PM', source: 'User', text: '<b>(Security Manager):</b> Your UEBA tool flags a trusted, long-time accountant who has shown no previous signs of trouble. Over the past week, they have been accessing sensitive R&D project files and engineering schematics late at night, a significant deviation from their normal behavior and job responsibilities.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Suspend the user\'s account and revoke all access.', icon: 'mdi-account-cancel', nextEventId: 'insider_7_risky_feedback' },
            { id: 2, text: 'Launch a discreet investigation by reviewing logs and consulting their manager.', icon: 'mdi-magnify', nextEventId: 'insider_7_good_feedback' },
            { id: 3, text: 'Immediately call the employee in for a confrontation.', icon: 'mdi-account-alert-outline', nextEventId: 'insider_7_bad_feedback' }
            ]
        },
        'insider_7_good_feedback': {
            log: [{ time: '05:17 PM', source: 'System', text: 'This is the correct, professional approach. You are taking the alert seriously by investigating, but not making a rash decision that could damage the reputation of a potentially innocent employee.', type: 'system' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_8' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'insider_7_bad_feedback': {
            log: [{ time: '05:17 PM', source: 'Alert', text: 'This is a poor approach that could backfire. A direct confrontation will alert a malicious actor, and if the activity was benign, you have damaged the trust of a long-time employee.', type: 'alert' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_8' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'insider_7_risky_feedback': {
            log: [{ time: '05:17 PM', source: 'User', text: 'This is a disproportionate response. A UEBA alert is an indicator that requires investigation and context, not an immediate, punitive action that could disrupt business and harm employee morale.', type: 'user' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_8' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'insider_8': {
            log: [
            { time: '06:30 PM', source: 'System', text: 'Network Alert: Rogue Wi-Fi access point detected.', type: 'system' },
            { time: '06:31 PM', source: 'User', text: '<b>(Network Administrator):</b> While performing a wireless network sweep, you detect a rogue Wi-Fi access point broadcasting from within the office. Its network name (SSID) is \'XYZ_Corp_Guest_WiFi,\' a deliberate and deceptive imitation of the legitimate \'XYZ_Guest\' network, designed to trick employees into connecting.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Block the device\'s MAC address on the network switch.', icon: 'mdi-block-helper', nextEventId: 'insider_8_bad_feedback' },
            { id: 2, text: 'Send a company-wide email warning employees not to connect.', icon: 'mdi-email-alert', nextEventId: 'insider_8_risky_feedback' },
            { id: 3, text: 'Physically locate the rogue device, disconnect it, and report it.', icon: 'mdi-access-point-network-off', nextEventId: 'insider_8_good_feedback' }
            ]
        },
        'insider_8_good_feedback': {
            log: [{ time: '06:32 PM', source: 'System', text: 'You have eliminated the threat at its source. Physically locating and disconnecting a rogue device is the only way to guarantee it can no longer be used to intercept company traffic or launch attacks against employees.', type: 'system' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_9' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'insider_8_bad_feedback': {
            log: [{ time: '06:32 PM', source: 'Alert', text: 'This is only a temporary solution. A determined insider can simply change the device\'s MAC address (spoofing) to easily bypass your block and bring the rogue access point back online.', type: 'alert' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_9' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'insider_8_risky_feedback': {
            log: [{ time: '06:32 PM', source: 'User', text: 'This action is insufficient. While warning employees is a good secondary step, it does not remove the malicious device from your environment, leaving less vigilant employees vulnerable to a man-in-the-middle attack.', type: 'user' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_9' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'insider_9': {
            log: [
            { time: '07:45 PM', source: 'System', text: 'Code Review Alert: Suspicious logic found in new code commit.', type: 'system' },
            { time: '07:46 PM', source: 'User', text: '<b>(Software Developer):</b> During a peer code review, you spot a suspicious function added by another developer. The code is designed to check if the current user is a specific, hardcoded admin account. For all other users, it disables critical security logging, effectively making their actions invisible to monitoring tools.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Leave a public comment asking the developer to explain the code.', icon: 'mdi-comment-text-multiple-outline', nextEventId: 'insider_9_risky_feedback' },
            { id: 2, text: 'Approve the code, assuming it\'s for a legitimate debugging purpose.', icon: 'mdi-code-braces-check', nextEventId: 'insider_9_bad_feedback' },
            { id: 3, text: 'Reject the commit and privately report the logic to your manager and security.', icon: 'mdi-bug-check-outline', nextEventId: 'insider_9_good_feedback' }
            ]
        },
        'insider_9_good_feedback': {
            log: [{ time: '07:47 PM', source: 'System', text: 'You have prevented a serious vulnerability from reaching production. This type of code is a potential backdoor, and by reporting it privately, you allow for a discreet investigation without tipping off a malicious insider.', type: 'system' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_10' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'insider_9_bad_feedback': {
            log: [{ time: '07:47 PM', source: 'Alert', text: 'This is a serious act of negligence. By approving the code, you have knowingly allowed a security backdoor to be deployed, creating a massive blind spot that an attacker could exploit to steal data undetected.', type: 'alert' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_10' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'insider_9_risky_feedback': {
            log: [{ time: '07:47 PM', source: 'User', text: 'This action risks alerting the malicious developer. A public inquiry gives them a chance to remove the code, hide their tracks, and attempt to insert the backdoor again in a more subtle way later.', type: 'user' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'insider_10' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'insider_10': {
            log: [
            { time: '08:30 PM', source: 'System', text: 'Email Alert: Suspicious urgent wire transfer request.', type: 'system' },
            { time: '08:31 PM', source: 'User', text: '<b>(Financial Analyst):</b> You receive an email from your manager requesting you process an urgent wire transfer for a large sum to a new international vendor. The email stresses that it must be done before the end of the day, but the writing style feels slightly unusual, and you know your manager is in all-day offsite meetings and hard to reach.', type: 'user' }
            ],
            prompt: 'What is your final decision?',
            choices: [
            { id: 1, text: 'Approve the transfer, trusting the email from your manager\'s account.', icon: 'mdi-send', nextEventId: 'insider_end_bad' },
            { id: 2, text: 'Reply to the email asking for more details on the vendor.', icon: 'mdi-email-send-outline', nextEventId: 'insider_end_risky' },
            { id: 3, text: 'Do not approve; verify the request via a different channel (e.g., text).', icon: 'mdi-phone-in-talk', nextEventId: 'insider_end_good' }
            ]
        },
        'insider_end_good': {
            log: [{ time: '08:32 PM', source: 'System', text: 'You have prevented a significant financial loss. This is the correct procedure for handling a suspected Business Email Compromise (BEC) attack. Verifying the request through a different, trusted channel is the only way to confirm its legitimacy.', type: 'system' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'insider_end_bad': {
            log: [{ time: '08:32 PM', source: 'Alert', text: 'This decision has led to a major financial loss for the company. You fell for common social engineering tactics—urgency and authority—and sent company funds directly to a criminal.', type: 'alert' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'insider_end_risky': {
            log: [{ time: '08:32 PM', source: 'User', text: 'This action keeps you in communication with the attacker. If your manager\'s email account is compromised, replying only serves to give the attacker a chance to persuade you further. Out-of-band verification is required.', type: 'user' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Compromised', color: 'orange' }
        }
        },
        authenticationNarrativeTree: {
        'authentication_1': {
            log: [
            { time: '09:00 AM', source: 'System', text: 'Critical Alert: VPN brute-force attack detected.', type: 'system' },
            { time: '09:01 AM', source: 'User', text: '<b>(SOC Analyst):</b> Your SIEM dashboard lights up with a critical alert. Over 50,000 failed login attempts from a single IP address in China have been recorded against your company\'s public-facing VPN portal in the last 15 minutes. The attempts seem to be cycling through a list of common usernames.', type: 'user' }
            ],
            prompt: 'What is your immediate response?',
            choices: [
            { id: 1, text: 'Wait for the attack to stop on its own to gather more data.', icon: 'mdi-clock-time-four', nextEventId: 'authentication_1_risky_feedback' },
            { id: 2, text: 'Block the source IP address at the firewall.', icon: 'mdi-firewall', nextEventId: 'authentication_1_good_feedback' },
            { id: 3, text: 'Increase the account lockout threshold to allow for more attempts.', icon: 'mdi-lock-open-alert', nextEventId: 'authentication_1_bad_feedback' }
            ]
        },
        'authentication_1_good_feedback': {
            log: [{ time: '09:02 AM', source: 'System', text: 'You\'ve stopped the immediate attack. Blocking the malicious IP address is a crucial first step in mitigating a brute-force attack and reducing the load on your authentication systems.', type: 'system' }],
            prompt: 'Scenario 1 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_2' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'authentication_1_bad_feedback': {
            log: [{ time: '09:02 AM', source: 'Alert', text: 'This action has weakened your security posture. By increasing the lockout threshold, you have made it easier for the attacker to guess a password before the account is locked, putting user accounts at greater risk.', type: 'alert' }],
            prompt: 'Scenario 1 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_2' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'authentication_1_risky_feedback': {
            log: [{ time: '09:02 AM', source: 'User', text: 'Your inaction has left the primary gateway to your network under active assault. Allowing a brute-force attack to continue risks a potential breach and puts unnecessary strain on critical infrastructure.', type: 'user' }],
            prompt: 'Scenario 1 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_2' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'authentication_2': {
            log: [
            { time: '10:15 AM', source: 'System', text: 'Impossible Travel Alert: Multiple successful logins from unusual locations.', type: 'system' },
            { time: '10:16 AM', source: 'User', text: '<b>(Security Analyst):</b> You are reviewing a report of impossible travel alerts. In the last hour, 15 different user accounts have successfully logged in from their usual city and, minutes later, also from an IP address in Nigeria. None of these users are authorized for international travel, and the successful logins are highly suspicious.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Email the 15 users to ask if their logins were legitimate.', icon: 'mdi-email-outline', nextEventId: 'authentication_2_bad_feedback' },
            { id: 2, text: 'Disable the impossible travel alert, as it\'s creating too much noise.', icon: 'mdi-alert-off', nextEventId: 'authentication_2_risky_feedback' },
            { id: 3, text: 'Initiate a password reset for all 15 affected accounts immediately.', icon: 'mdi-lock-reset', nextEventId: 'authentication_2_good_feedback' }
            ]
        },
        'authentication_2_good_feedback': {
            log: [{ time: '10:17 AM', source: 'System', text: 'You have effectively contained the breach. Forcing a password reset for the compromised accounts immediately revokes the attacker\'s access and is the correct first step in remediating a credential stuffing attack.', type: 'system' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_3' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'authentication_2_bad_feedback': {
            log: [{ time: '10:17 AM', source: 'Alert', text: 'This response is slow and risky. By emailing the users, you are not only delaying the containment but also tipping off the attacker who may have control of the users\' email inboxes.', type: 'alert' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_3' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'authentication_2_risky_feedback': {
            log: [{ time: '10:17 AM', source: 'User', text: 'You have disabled a critical security control. Ignoring or disabling these alerts means you will be blind to future credential stuffing attacks, leaving the organization vulnerable to widespread account takeovers.', type: 'user' }],
            prompt: 'Scenario 2 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_3' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'authentication_3': {
            log: [
            { time: '11:30 AM', source: 'System', text: 'Account Lockout Alert: Widespread account lockouts detected.', type: 'system' },
            { time: '11:31 AM', source: 'User', text: '<b>(Identity & Access Management Specialist):</b> The help desk is being flooded with calls from users who are locked out of their accounts. You check the central authentication logs and notice a pattern: hundreds of accounts have had a single failed login attempt using the same password, "Winter2025!", triggering the lockout policy.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Bulk-unlock all the affected accounts to clear help desk tickets.', icon: 'mdi-lock-open-variant', nextEventId: 'authentication_3_bad_feedback' },
            { id: 2, text: 'Send a company-wide email telling users not to use "Winter2025!".', icon: 'mdi-email-alert-outline', nextEventId: 'authentication_3_risky_feedback' },
            { id: 3, text: 'Identify the source IP and check for other activity from it.', icon: 'mdi-magnify-scan', nextEventId: 'authentication_3_good_feedback' }
            ]
        },
        'authentication_3_good_feedback': {
            log: [{ time: '11:32 AM', source: 'System', text: 'This is a good investigative step. Identifying the source of the password spraying attack is crucial for blocking it and determining if the attacker has had any success with other methods.', type: 'system' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_4' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'authentication_3_bad_feedback': {
            log: [{ time: '11:32 AM', source: 'Alert', text: 'This action re-enables the accounts for the attacker to target again. While it resolves the users\' immediate issue, it does nothing to stop the ongoing attack and may lead to a breach.', type: 'alert' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_4' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'authentication_3_risky_feedback': {
            log: [{ time: '11:32 AM', source: 'User', text: 'This action is ineffective and potentially harmful. The attacker is using this password, not your users. This email would only cause confusion and does nothing to mitigate the actual attack.', type: 'user' }],
            prompt: 'Scenario 3 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_4' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'authentication_4': {
            log: [
            { time: '12:45 PM', source: 'System', text: 'Phone Call Alert: MFA Fatigue Attack reported by executive.', type: 'system' },
            { time: '12:46 PM', source: 'User', text: '<b>(IT Help Desk Manager):</b> A C-level executive calls your personal line, sounding panicked. They report receiving over 50 multi-factor authentication (MFA) push notifications on their phone in the last five minutes, and they are worried about being hacked. They are asking you to "please just make it stop" so they can focus on an important call.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Disable MFA for the executive\'s account temporarily.', icon: 'mdi-account-off-outline', nextEventId: 'authentication_4_bad_feedback' },
            { id: 2, text: 'Tell the executive to approve one prompt to see if it stops the rest.', icon: 'mdi-account-key', nextEventId: 'authentication_4_risky_feedback' },
            { id: 3, text: 'Advise the user to deny the prompts and not approve any.', icon: 'mdi-lock', nextEventId: 'authentication_4_good_feedback' }
            ]
        },
        'authentication_4_good_feedback': {
            log: [{ time: '12:47 PM', source: 'System', text: 'You\'ve provided sound advice to prevent a breach. Instructing the user to deny the prompts is the correct immediate action to thwart an MFA fatigue attack, where an attacker hopes the user will accidentally approve one.', type: 'system' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_5' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'authentication_4_bad_feedback': {
            log: [{ time: '12:47 PM', source: 'Alert', text: 'This is a critical security failure. Disabling MFA on a high-value account, especially one under active attack, removes a key defense layer and makes a password-only compromise trivial for the attacker.', type: 'alert' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_5' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'authentication_4_risky_feedback': {
            log: [{ time: '12:47 PM', source: 'User', text: 'You have just given an attacker access to a privileged account. By advising the user to approve a prompt, you have completed the authentication for the criminal, leading to a direct and serious breach.', type: 'user' }],
            prompt: 'Scenario 4 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_5' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'authentication_5': {
            log: [
            { time: '01:50 PM', source: 'System', text: 'User Reported Incident: Possible password phishing.', type: 'system' },
            { time: '01:51 PM', source: 'User', text: '<b>(IT Support Specialist):</b> A user submits a ticket stating they received a password expiration notice via email that looked official. They clicked the link, entered their old password, new password, and MFA code on the page it took them to. However, their password hasn\'t changed, and they are now suspicious about the email\'s legitimacy.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Ask the user to forward you the suspicious email for analysis.', icon: 'mdi-email-search', nextEventId: 'authentication_5_bad_feedback' },
            { id: 2, text: 'Tell the user to try the password reset process again using the official portal.', icon: 'mdi-web', nextEventId: 'authentication_5_risky_feedback' },
            { id: 3, text: 'Immediately expire the user\'s password and check for suspicious logins.', icon: 'mdi-lock-reset', nextEventId: 'authentication_5_good_feedback' }
            ]
        },
        'authentication_5_good_feedback': {
            log: [{ time: '01:52 PM', source: 'System', text: 'You have acted quickly to mitigate the account takeover. Forcing a password reset and investigating for unauthorized access are the correct first steps after a user has likely given their credentials away in a phishing attack.', type: 'system' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_6' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'authentication_5_bad_feedback': {
            log: [{ time: '01:52 PM', source: 'Alert', text: 'This action delays the critical response. While analyzing the email is important for a wider response, the user\'s account is actively compromised and must be secured immediately before any other action is taken.', type: 'alert' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_6' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'authentication_5_risky_feedback': {
            log: [{ time: '01:52 PM', source: 'User', text: 'You have ignored the immediate threat. The user\'s account is likely compromised. Directing them to reset their password without first securing the account means the attacker may still have access or can intercept the reset.', type: 'user' }],
            prompt: 'Scenario 5 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_6' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'authentication_6': {
            log: [
            { time: '03:00 PM', source: 'System', text: 'Kerberos Alert: Anomalous service ticket request.', type: 'system' },
            { time: '03:01 PM', source: 'User', text: '<b>(System Administrator):</b> Your security monitoring tool flags a rare event in Active Directory. A standard, non-privileged user account has successfully requested a Kerberos service ticket for the \'SQLSvc\' account, which runs a critical production database. This type of request is highly abnormal and can be a precursor to an offline password cracking attack.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Assume it\'s a software glitch and close the alert.', icon: 'mdi-close-circle-outline', nextEventId: 'authentication_6_bad_feedback' },
            { id: 2, text: 'Reset the password for the \'SQLSvc\' account to something very complex.', icon: 'mdi-lock-reset', nextEventId: 'authentication_6_risky_feedback' },
            { id: 3, text: 'Disable the user account and investigate its recent activity.', icon: 'mdi-account-off', nextEventId: 'authentication_6_good_feedback' }
            ]
        },
        'authentication_6_good_feedback': {
            log: [{ time: '03:02 PM', source: 'System', text: 'You\'ve contained a potential internal threat. This activity is a strong indicator of Kerberoasting. Disabling the account stops the attacker\'s immediate foothold and allows for a safe investigation.', type: 'system' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_7' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'authentication_6_risky_feedback': {
            log: [{ time: '03:02 PM', source: 'User', text: 'A good, necessary step for remediation. While this doesn\'t address the compromised user account, strengthening the service account password makes the stolen ticket hash much harder or impossible to crack, protecting the service.', type: 'user' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_7' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'authentication_6_bad_feedback': {
            log: [{ time: '03:02 PM', source: 'Alert', text: 'You have ignored a classic Active Directory attack. This was likely not a glitch, and an attacker now possesses the password hash for a critical service account, which they can crack offline at their leisure.', type: 'alert' }],
            prompt: 'Scenario 6 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_7' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'authentication_7': {
            log: [
            { time: '04:15 PM', source: 'System', text: 'Incident Investigation: Suspicious lateral movement detected.', type: 'system' },
            { time: '04:16 PM', source: 'User', text: '<b>(Incident Responder):</b> You are investigating a compromised workstation. EDR logs show that the attacker used PowerShell to remotely access an administrative share on a file server. However, when you cross-reference the logs, the server\'s security event log shows a successful logon but no credential validation, indicating a non-traditional authentication method was used.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Reboot both machines to clear any active sessions.', icon: 'mdi-restart', nextEventId: 'authentication_7_bad_feedback' },
            { id: 2, text: 'Run an antivirus scan on the file server.', icon: 'mdi-virus-scan', nextEventId: 'authentication_7_risky_feedback' },
            { id: 3, text: 'Isolate the workstation and server; check memory for credential hashes.', icon: 'mdi-network-off', nextEventId: 'authentication_7_good_feedback' }
            ]
        },
        'authentication_7_good_feedback': {
            log: [{ time: '04:17 PM', source: 'System', text: 'This is a strong incident response action. Isolating the hosts contains the threat. Investigating memory is key, as this activity is a classic sign of a Pass-the-Hash attack, where password hashes are used instead of passwords.', type: 'system' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_8' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'authentication_7_bad_feedback': {
            log: [{ time: '04:17 PM', source: 'Alert', text: 'You have destroyed critical forensic evidence. Rebooting the machines will clear the volatile memory (RAM), destroying the credential hashes the attacker used and making your investigation significantly harder.', type: 'alert' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_8' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'authentication_7_risky_feedback': {
            log: [{ time: '04:17 PM', source: 'User', text: 'This action misses the point of the attack. Pass-the-Hash is an attack technique that uses legitimate Windows functions. It is not malware that an antivirus scan would typically detect.', type: 'user' }],
            prompt: 'Scenario 7 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_8' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'authentication_8': {
            log: [
            { time: '05:30 PM', source: 'System', text: 'Domain Controller Alert: Golden Ticket attack detected.', type: 'system' },
            { time: '05:31 PM', source: 'User', text: '<b>(Senior Cybersecurity Engineer):</b> While auditing Domain Controller logs, you find a Kerberos ticket (TGT) being used that is highly anomalous. Its lifetime is set to 10 years, it has been issued for a non-existent user, yet it grants full Enterprise Admin privileges. This ticket violates all domain policies and is a sign of a severe compromise.', type: 'user' }
            ],
            prompt: 'What is your immediate response?',
            choices: [
            { id: 1, text: 'Block the source IP using the malicious ticket.', icon: 'mdi-firewall', nextEventId: 'authentication_8_bad_feedback' },
            { id: 2, text: 'Try to find and disable the non-existent user account.', icon: 'mdi-account-search', nextEventId: 'authentication_8_risky_feedback' },
            { id: 3, text: 'Immediately double-reset the KRBTGT account password.', icon: 'mdi-lock-reset', nextEventId: 'authentication_8_good_feedback' }
            ]
        },
        'authentication_8_good_feedback': {
            log: [{ time: '05:32 PM', source: 'System', text: 'You have performed the one and only correct remediation for this attack. Resetting the KRBTGT password twice is the textbook method for invalidating all Kerberos tickets in the domain, including the forged "Golden Ticket" the attacker is using.', type: 'system' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_9' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'authentication_8_risky_feedback': {
            log: [{ time: '05:32 PM', source: 'User', text: 'This action is futile. The "Golden Ticket" is a forged authentication token. The user it was forged for doesn\'t actually exist in Active Directory, so there is nothing to disable. The ticket itself must be invalidated.', type: 'user' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_9' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'authentication_8_bad_feedback': {
            log: [{ time: '05:32 PM', source: 'Alert', text: 'This is an ineffective, temporary measure. The attacker has the keys to the kingdom. They can use the forged ticket from any system on the network, so blocking one IP address will not stop them.', type: 'alert' }],
            prompt: 'Scenario 8 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_9' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'authentication_9': {
            log: [
            { time: '06:45 PM', source: 'System', text: 'User Report: Suspicious email activity after session termination.', type: 'system' },
            { time: '06:46 PM', source: 'User', text: '<b>(Web Application Security Analyst):</b> A user reports that while they were actively using the company\'s webmail portal, their session was suddenly terminated. Moments later, their colleagues began receiving phishing emails sent from the user\'s account. You suspect the user\'s session cookie was stolen, possibly through a cross-site scripting (XSS) vulnerability.', type: 'user' }
            ],
            prompt: 'What is your next step?',
            choices: [
            { id: 1, text: 'Advise the user to clear their browser cache and cookies.', icon: 'mdi-cookie-remove', nextEventId: 'authentication_9_bad_feedback' },
            { id: 2, text: 'Take the webmail application offline for emergency patching.', icon: 'mdi-web-off', nextEventId: 'authentication_9_risky_feedback' },
            { id: 3, text: 'Force a logout of all active sessions for that user account.', icon: 'mdi-logout', nextEventId: 'authentication_9_good_feedback' }
            ]
        },
        'authentication_9_good_feedback': {
            log: [{ time: '06:47 PM', source: 'System', text: 'You have successfully revoked the attacker\'s access. Forcing a global logout invalidates all of the user\'s session tokens, including the one the attacker stole, kicking them out of the compromised webmail session.', type: 'system' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_10' }],
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'authentication_9_bad_feedback': {
            log: [{ time: '06:47 PM', source: 'Alert', text: 'This action does not solve the problem. Clearing the user\'s cookies does nothing to invalidate the stolen session cookie that the attacker is actively using from their own machine.', type: 'alert' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_10' }],
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'authentication_9_risky_feedback': {
            log: [{ time: '06:47 PM', source: 'User', text: 'This is a massive overreaction that causes unnecessary downtime. While patching is needed, the immediate priority is to revoke the attacker\'s access to the specific user\'s account, which does not require a full system outage.', type: 'user' }],
            prompt: 'Scenario 9 Complete. Continue?',
            choices: [{ id: 1, text: 'Continue', icon: 'mdi-chevron-right', nextEventId: 'authentication_10' }],
            systemStatus: { text: 'Compromised', color: 'orange' }
        },
        'authentication_10': {
            log: [
            { time: '07:50 PM', source: 'System', text: 'User Reported Incident: Suspicious third-party app permissions.', type: 'system' },
            { time: '07:51 PM', source: 'User', text: '<b>(Cloud Security Engineer):</b> An employee forwards you an OAuth consent screen for a new third-party "AI Productivity" browser extension they want to use. You review the requested permissions and see that it is asking for the ability to \'read, send, delete, and manage all your email\' and \'access your files and calendar permanently, even when you are not using the app.\'', type: 'user' }
            ],
            prompt: 'What is your final decision?',
            choices: [
            { id: 1, text: 'Tell the user to approve it but to be careful with it.', icon: 'mdi-account-details', nextEventId: 'authentication_end_risky' },
            { id: 2, text: 'Deny the application and add it to the organization\'s blocklist.', icon: 'mdi-block-helper', nextEventId: 'authentication_end_good' },
            { id: 3, text: 'Approve the request, as the user claims it will improve their productivity.', icon: 'mdi-check-circle-outline', nextEventId: 'authentication_end_bad' }
            ]
        },
        'authentication_end_good': {
            log: [{ time: '07:52 PM', source: 'System', text: 'You have protected the user and the company from a potential data breach. These excessive permissions are a huge red flag for a malicious or data-hungry application. Blocking it is the correct security decision.', type: 'system' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Secure', color: 'green' }
        },
        'authentication_end_bad': {
            log: [{ time: '07:52 PM', source: 'Alert', text: 'You have just approved a massive security risk. You have authorized a third-party application to have god-like permissions over a user\'s sensitive data, creating a permanent backdoor that bypasses your other security controls.', type: 'alert' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Critical', color: 'red' }
        },
        'authentication_end_risky': {
            log: [{ time: '07:52 PM', source: 'User', text: 'You have abdicated your security responsibility. The purpose of your role is to make these risk-based decisions. Shifting the responsibility to an untrained user to "be careful" with a dangerous application is negligent.', type: 'user' }],
            prompt: 'Simulation Complete. Review your performance.',
            choices: [{ id: 1, text: 'Start Over', icon: 'mdi-restart', nextEventId: 'start' }],
            isEnd: true,
            systemStatus: { text: 'Compromised', color: 'orange' }
        }
        },
        baseNarrativeTree: {
        'start': {
            log: [
            { time: '08:00 AM', source: 'System', text: 'Login successful. Welcome, Analyst. System Status: Nominal.', type: 'system' },
            { time: '08:01 AM', source: 'User', text: '<b>(HR):</b> Welcome! Remember to complete your Data Privacy training today.', type: 'user' }
            ],
            prompt: 'What is your immediate next step?',
            choices: [
            { id: 1, text: 'Quick Fix', icon: 'mdi-flash', nextEventId: 'crisis_path_start' },
            { id: 2, text: 'Cautious Approach', icon: 'mdi-magnify-scan', nextEventId: 'crisis_path_start' },
            { id: 3, text: 'Thorough Investigation', icon: 'mdi-file-document-search', nextEventId: 'correct_path_start' }
            ]
        }
        }
    };
    },
    mounted() {
    this.loadScenario(this.scenarioType);
    },
    watch: {
    scenarioType(newVal) {
        this.loadScenario(newVal);
    }
    },
    methods: {
    getSourceClass(source) {
        switch (source.toLowerCase()) {
        case 'system': return 'blue--text';
        case 'user': return 'yellow--text';
        case 'alert': return 'red--text text--darken-2 font-weight-bold';
        default: return '';
        }
        },
    handleExitClick() {
         const confirmExit = window.confirm('Do you want to exit Incident Response Terminal?');
         if (confirmExit) {
         this.$emit('exit');
       }
      },
    
    loadScenario(type) {
        this.storyLog = [];
        this.systemStatus = { text: 'Nominal', color: 'green' };
        this.aiDebrief = null;
        this.isSimulationEnd = false;
        this.userDecisions = []; 

        // Select the correct narrative tree
        if (type === 'phishing') {
        this.narrativeTree = this.phishingNarrativeTree || {};
        this.currentEventId = 'phishing_1';
        } else if (type === 'ransomware') {
        this.narrativeTree = this.ransomwareNarrativeTree || {};
        this.currentEventId = 'ransomware_1';
        } else if (type === 'insider') {
        this.narrativeTree = this.insiderNarrativeTree || {};
        this.currentEventId = 'insider_1';
        } else if (type === 'authentication') {
        this.narrativeTree = this.authenticationNarrativeTree || {};
        this.currentEventId = 'authentication_1';
        } else {
        this.narrativeTree = this.baseNarrativeTree;
        this.currentEventId = 'start';
        }
        this.loadEvent(this.currentEventId);
    },
    loadEvent(eventId) {
        const event = this.narrativeTree[eventId];
        if (!event) return;
        event.log.forEach(logEntry => this.storyLog.push(logEntry));
        this.currentPrompt = event.prompt;
        this.currentChoices = event.choices;
        if (event.systemStatus) {
        this.systemStatus = event.systemStatus;
        }
        this.isSimulationEnd = !!event.isEnd;
        this.scrollToEnd();
    },
    makeChoice(nextEventId) {
        if (nextEventId === 'start') {
        this.storyLog = [];
        this.systemStatus = { text: 'Nominal', color: 'green' };
        this.aiDebrief = null;
        this.scenarioChosen = false;
        this.$emit('exit'); 
        return;
        }

        const currentEvent = this.narrativeTree[this.currentEventId];
        const chosenChoice = currentEvent.choices.find(c => c.nextEventId === nextEventId);
        const resultingEvent = this.narrativeTree[nextEventId];

        if (chosenChoice && resultingEvent && resultingEvent.systemStatus) {
        let quality = 'unknown';
        switch (resultingEvent.systemStatus.text) {
            case 'Secure':
            quality = 'good';
            break;
            case 'Compromised':
            quality = 'risky';
            break;
            case 'Critical':
            quality = 'bad';
            break;
        }

        this.userDecisions.push({
            scenarioId: this.currentEventId,
            choiceId: chosenChoice.id,
            choiceText: chosenChoice.text,
            nextEventId: nextEventId,
            quality: quality
        });
        }

        this.currentChoices = [];
        setTimeout(() => {
        this.currentEventId = nextEventId;
        this.loadEvent(this.currentEventId);
        }, 500);
    },
    async getAIDebrief() {
        this.loadingAIDebrief = true;
        this.aiDebrief = null; // Clear previous debrief
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI thinking

        // --- START: MODIFIED DEBRIEF LOGIC (Generates an Object) ---
        const total = this.userDecisions.length;
        const good = this.userDecisions.filter(d => d.quality === 'good').length;
        const risky = this.userDecisions.filter(d => d.quality === 'risky').length;
        const bad = this.userDecisions.filter(d => d.quality === 'bad').length;

        let score = (total > 0) ? Math.round((good / total) * 100) : 0;
        let headline = '';
        let feedbackPoints = [];
        let improvementTopic = this.scenarioType.charAt(0).toUpperCase() + this.scenarioType.slice(1);

        if (total > 0 && good === total) {
        headline = 'Outstanding Performance!';
        feedbackPoints.push({
            type: 'good',
            text: `You correctly navigated all ${total} scenarios. Your understanding of ${improvementTopic} protocols is excellent.`
        });
        } else {
        // Assign headline based on score
        if (score >= 80) {
            headline = 'Strong Performance with Room for Review';
        } else if (score >= 50) {
            headline = 'Good Effort, but Key Areas Need Improvement';
        } else {
            headline = 'Critical Review Required';
        }

        // Add general feedback
        feedbackPoints.push({
            type: 'summary',
            text: `This simulation highlights a need for review in our ${improvementTopic} response protocols.`
        });

        // Add specific feedback for mistakes
        if (bad > 0) {
            feedbackPoints.push({
            type: 'bad',
            text: `Your critical mistakes often stemmed from acting without verification (like clicking a link or processing a payment) or failing to contain an active threat immediately. Always prioritize verification through a separate, trusted channel and immediate containment.`
            });
        }
        if (risky > 0) {
            feedbackPoints.push({
            type: 'risky',
            text: `Your risky choices (such as deleting an email without reporting it) protect you individually but leave the entire organization vulnerable. Always report threats to the security team so they are aware of the active threat.`
            });
        }
        }

        // Set the debrief as an object
        this.aiDebrief = {
        score: score,
        headline: headline,
        counts: { good, risky, bad, total },
        feedbackPoints: feedbackPoints
        };
        // --- END: MODIFIED DEBRIEF LOGIC ---
        
        this.loadingAIDebrief = false;
    },
    // --- START: NEW HELPER METHODS ---
    getDebriefIcon(type) {
        const icons = {
            good: 'mdi-check-circle',
            risky: 'mdi-alert-outline',
            bad: 'mdi-close-circle',
            summary: 'mdi-information-outline'
        };
        return icons[type] || 'mdi-help-circle';
    },
    getDebriefColor(type) {
        const colors = {
            good: 'green',
            risky: 'orange',
            bad: 'red',
            summary: 'rgba(255, 255, 255, 0.7)' 
        };
        return colors[type] || 'white';
    },
    // --- END: NEW HELPER METHODS ---
    scrollToEnd() {
        this.$nextTick(() => {
        const container = this.$el.querySelector('.v-sheet');
        if (container) container.scrollTop = container.scrollHeight;
        });
    }
    }
};
</script>