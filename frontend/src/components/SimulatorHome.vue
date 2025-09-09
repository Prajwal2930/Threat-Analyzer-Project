<template>
  <v-card color="#121212" class="pa-4">

    <v-container class="pa-6 text-center">
      <h3 class="white--text mb-6">Choose a Simulation Scenario</h3>
      <v-row justify="center" align="center" dense>
        <v-col cols="12" md="6" lg="3">
          <v-btn block large color="grey lighten-1" @click="$emit('scenario-selected', 'phishing')">
            <v-icon left>mdi-email-alert</v-icon> Phishing
          </v-btn>
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-btn block large color="red darken-1" @click="$emit('scenario-selected', 'ransomware')">
            <v-icon left>mdi-virus</v-icon> Ransomware
          </v-btn>
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-btn block large color="green accent-1" @click="$emit('scenario-selected', 'insider')">
            <v-icon left>mdi-account-alert</v-icon> Insider Threat
          </v-btn>
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-btn block large color="tim lighten-4" @click="$emit('scenario-selected', 'authentication')">
            <v-icon left>mdi-fingerprint</v-icon> Authentication Attacks
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
export default {
  name: 'SimulatorHome',
};
</script>
  