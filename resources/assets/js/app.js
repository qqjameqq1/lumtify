import Vue from 'vue'

import Vuex from 'vuex'

import VueRouter from 'vue-router'

import VueResource from 'vue-resource'

import Vuetify from 'vuetify'

import Marked from 'marked'

import router from './router'

import PageLumtify from './Components/PageLumtify.vue'

Vue.use(Vuex)

Vue.use(VueRouter)

Vue.use(VueResource)

Vue.use(Vuetify)

// set up jwt auth in vue http
Vue.http.interceptors.push((request, next) => {
	var token = localStorage.getItem('lumtify') || ''

    request.headers.set('authorization', 'bearer ' + token)

    next()
})

// set markdown editor options
Marked.setOptions({
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
})

// use window marked if want to marked in local component
// like 
// computed: {
//     markdown () {
//         return marked(content)
//     }
// }
// window.marked = Marked
// use like filter
// {{ content | marked }} => only text
// Vue.filter('marked', function (content) {
// 	return marked(content)
// })

Vue.directive('markdown', {
	bind (el, binding, vnode) {
		el.innerHTML = Marked(binding.value)
	},
	// inserted () {},
	update (el, binding, vnode) {
		el.innerHTML = Marked(binding.value)
	},
	// componentUpdated () {},
	// unbind () {}
})

const auth = {
	isAuth: false,
	user: {},
	roles: []
}

const store = new Vuex.Store({
	state: {
		auth: auth
	},
	getters: {
		isAuth ({ auth }) {
			return auth.isAuth
		},
		user ({ auth }) {
			return auth.user
		},
		hasRoles: ({ auth }) => (roles) => {
            if (auth.roles.length === 0) {
                return false
            }
            var length = roles.length

            for (var i=0; i<length; i++) {
                if (auth.roles.indexOf(roles[i]) >= 0) {
                    return true
                }
            }
            return false
        },
        isSelf: ({ auth }) => (uid) => {
        	return auth.user.uid === uid
        },
        notSelf: ({ auth }) => (uid) => {
        	return auth.user.uid !== uid
        },
        hasArticle: ({ auth }) => (article) => {
            if (!article.author) {
				return false
			}
			if (auth.roles.indexOf("admin") >= 0) {
				return true
			}
			if (article.author.uid === auth.user.uid) {
				return true
			}
			return false
        },
	},
	mutations: {
		authenticate ({ auth }, isAuth) {
			auth.isAuth = isAuth
		},
		login ({ auth }, user) {
			auth.user = user
		},
		acting ({ auth }, roles) {
			auth.roles = roles
		}
	},
	actions: {
		loginAs ({ commit }, user) {
			commit('authenticate', true)
			commit('login', user)
		},
		actingAs ({ commit }, roles) {
			commit('acting', roles)
		}
	}
})

router.beforeEach((to, from, next) => {
	Vue.http.get('/api/auth/user').then((res) => {
		var data = res.body

		if (data.success) {
			auth.isAuth = true
			auth.user = data.user
			auth.roles = data.roles
		}
	}).catch((err) => {
		var e = err.body

		if (!e.success) {
			localStorage.setItem('lumtify', '')
			auth.isAuth = false
		}
	}).then(() => {
		var routerAuth = null

		to.matched.some((record) => {
			if (record.meta.auth) {
				routerAuth = record.meta.auth
			}
		})

	    if (routerAuth && routerAuth.required) {
		    if (!auth.isAuth) {
		        next({
		            name: 'login'
		        })
		    } else {
		    	if (routerAuth.roles) {
		    		var isAuth = false
		    		var length = routerAuth.roles.length

		    		for (var i=0; i<length; i++) {
		                if (auth.roles.indexOf(routerAuth.roles[i]) >= 0) {
		                	isAuth = true
		                	break;
		                }
		            }
		            if (isAuth) {
		            	next()
		            } else {
		            	next({
				            name: 'home'
				        })
		            }
		    	} else {
		    		next()
		    	}
		    }
	    } else {
			next()
	    }
	})
})

const app = new Vue({
	router,
	store,
	components: {
		PageLumtify
	},
	data () {
		return {
			auth: auth
		}
	}
}).$mount('#app')