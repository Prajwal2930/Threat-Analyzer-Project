import Vue from 'vue'
import VueRouter from 'vue-router'

// Component imports
import HomeLanding from '../components/HomeLandpage.vue'
import Login from '../components/SignIn.vue'
import Signup from '../components/SignUp.vue'
import Simulator from '../components/Simulator.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeLanding,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/signup',
    name: 'Signup',
    component: Signup,
  },
  {
    path: '/simulator',
    name: 'Simulator',
    component: Simulator,
    meta: { requiresAuth: true }, // Protected route
  },
  // Fallback route (optional)
  {
    path: '*',
    redirect: '/',
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

// Navigation Guard to protect routes like middleware
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth) //Checks if target route requires authentication
  const token = localStorage.getItem('token')

  if (requiresAuth && !token) {
    next({ name: 'Login' }) // Redirect to login if not authenticated
  } else {
    next() // Otherwise allow access
  }
})

export default router
