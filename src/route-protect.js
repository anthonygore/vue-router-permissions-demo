import Vue from 'vue';

class RouteProtect {
  constructor(router) {
    this.router = router;
    this.vm = new Vue({
      data: {
        user: null
      }
    });
  }
  get user() {
    if (!this.vm.user) {
      throw new Error("Do not attempt to access user before it's set");
    }
    return this.vm.user;
  }
  set user(user) {
    this.vm.user = user;
    if (this.to && this.to.meta.permissions) {
      let matched = this.to.meta.permissions.find(item => item.type === this.vm.user.type);
      if (matched) {
        if ((typeof matched.access === "boolean" && !matched.access) || matched.access(this.vm.user, this.to)) {
          this.router.push({ name: matched.redirect });
        }
      }
    }
  }
  resolve(to, from, next) {
    this.to = to;
    if (to.meta.permissions) {
      let matched = to.meta.permissions.find(item => item.type === this.vm.user.type);
      if (matched) {
        if (typeof matched.access === "boolean") {
          matched.access ? next() : next({ name: matched.redirect });
        } else {
          matched.access(this.vm.user, to) ? next() : next({ name: matched.redirect });
        }
      } else {
        next();
      }
    } else {
      next();
    }
  }
}

export default {
  install(Vue, router) {
    let protect = new RouteProtect(router);
    Vue.prototype.$protect = protect;
    router.beforeEach((to, from, next) => protect.resolve(to, from, next));
  }
};
