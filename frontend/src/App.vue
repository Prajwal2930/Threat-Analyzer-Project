<template>
  <!-- v-app is the main Vuetify component that wraps your app -->
  <v-app :dark="isDarkMode">
    <!-- v-app-bar is the navigation bar at the top -->
    <v-app-bar app color="grey darken-4" dark>
      <v-toolbar-title>
        <v-avatar size="24" tile class="mr-2">
          <img src="@/assets/threat.png" alt="Threat" />
        </v-avatar>
        Threat Analyzer
      </v-toolbar-title>
      <v-spacer></v-spacer> <!--push all buttons to righ side-->
  
      <!-- Dark mode toggle button -->
      <v-btn text @click="toggleDarkMode">
        <v-icon left>{{ isDarkMode ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
        {{ isDarkMode ? 'Light' : 'Dark' }}
      </v-btn>

      <!-- Simulator/Home button -->
      <v-btn text @click="handleSimulatorClick">
        <v-icon left>mdi-training</v-icon>
        {{ isSimulatorOpen ? 'Home' : 'Simulator' }}
      </v-btn>

      <!-- Conditional rendering: Show Sign In/Sign Up when not logged in -->
      <v-btn
        v-if="!isLoggedIn"
        outlined
        color="white"
        @click="showLogin = true"
      >
        <v-icon left>mdi-login</v-icon>
        Sign in
      </v-btn>
      <v-btn
        v-if="!isLoggedIn"
        color="blue"
        class="ml-2 white--text"
        @click="showSignup = true"
      >
        <v-icon left>mdi-account-plus</v-icon>
        Sign up
      </v-btn>

      <!-- Show Logout when logged in -->
      <v-btn
        v-if="isLoggedIn"
        color="red"
        dark
        class="ml-2"
        @click="logout"
      >
        <v-icon left>mdi-logout</v-icon>
        Logout
      </v-btn>
    </v-app-bar>

    <!-- v-main holds the main content that Vue Router will render -->
    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- Sign-up Dialog -->
    <v-dialog
      v-model="showSignup"
      max-width="500"
      persistent
    >
      <Signup
        @close="showSignup = false"
        @open-signin="showLogin = true; showSignup = false;"
      />
    </v-dialog>

    <!-- Sign-in Dialog -->
    <v-dialog
      v-model="showLogin"
      max-width="500"
      persistent
    >
      <SignIn
        @close="showLogin = false"
        @open-signup="showLogin = false; showSignup = true;"
        @login-success="onLoginSuccess"
      />
    </v-dialog>

<v-dialog v-model="showConfirmDialog" max-width="400" persistent>
  <v-card class="text-center pa-4"> <v-card-text class="text-h5"> Are you sure you want to Go to HomePage ?
    </v-card-text>

    <v-card-actions class="justify-center pt-0"> <v-btn
      color="red" 
        @click="confirmNavigation(false)"
        variant="elevated"
        class="mx-2"
        min-width="120"
        size="large"
      >
        Cancel
      </v-btn>

      <v-btn
        color="green" variant="elevated"
        @click="confirmNavigation(true)"
        class="mx-2"
        min-width="120"
        size="large"
      >
        CONFIRM
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

  </v-app>
</template>

<script>
import Simulator from './components/Simulator.vue'
import Signup from './components/SignUp.vue'
import SignIn from './components/SignIn.vue'

export default {
  name: 'App',
  components: {
    Simulator,
    Signup,
    SignIn,
  },
  data() {
    return {
      showSimulator: false,
      showSignup: false,
      showLogin: false,
      isDarkMode: true,
      isLoggedIn: false,
      showConfirmDialog: false,
      pendingNavigation: null,
    }
  },

  computed: {
    isSimulatorOpen() {
      return this.showSimulator || this.$route.name === 'Simulator';
    }
  },
  methods: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
      this.$vuetify.theme.dark = this.isDarkMode
    },
    onLoginSuccess() {
      this.isLoggedIn = true
      this.showLogin = false
      this.showSignup = false
    },
    logout() {
      this.isLoggedIn = false
      localStorage.removeItem('token')
      if (this.$route.path !== '/') {
        this.$router.push('/')
      }
    },

    //login nahi hai to signin open karo
    handleSimulatorClick() {
      if (!this.isLoggedIn) {
        this.showLogin = true;
      } else {
        if (this.$route.name === 'Simulator') {
          this.showConfirmDialog = true;
          this.pendingNavigation = { name: 'Home' };
        } else {
          this.$router.push({ name: 'Simulator' }).catch(() => { });
        }
      }
    },

    handleExitTerminalClick() {
  const confirmed = window.confirm('Do you want to exit the Incident Response Terminal?');
  if (confirmed) {
    this.$router.push({ name: 'Home' });
  }
},

    confirmNavigation(agree) {
      this.showConfirmDialog = false;
      if (agree && this.pendingNavigation) {
        this.$router.push(this.pendingNavigation).catch(() => { });
      }
      this.pendingNavigation = null;
    },

    openSimulator() {
      if (this.isLoggedIn) {
        this.showSimulator = true
      } else {
        this.showLogin = true
      }
    },
    
  },
  mounted() {
    // when we refresh Check if token exists Local storage
    if (localStorage.getItem('token')) {
      this.isLoggedIn = true
    }
  },
};
 </script>