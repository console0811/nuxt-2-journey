<template>
  <v-app style="background: #e9f8f9">
    <Loading />
    <LayoutComponentNotification />
    <v-app-bar app clipped-left>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title class="text-capitalize">
        {{ $auth.user.type }}
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <v-btn text @click="logout()" class="mx-2">logout</v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list class="pa-2">
        <template v-for="route in navigation.routes">
          <v-list-item
            :to="{ name: route.name, params: route.params }"
            :key="route.text"
          >
            <v-list-item-content>
              <v-list-item-title class="text-capitalize">
                {{ route.text }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-row no-gutters class="pa-4">
        <Nuxt />
      </v-row>
    </v-main>
  </v-app>
</template>

<script>
import NavigationModel from "~/models/model.navigation";
export default {
  mounted() {
    this.navigation = new NavigationModel({ role: this.$auth.user.type });
  },
  data() {
    return {
      drawer: true,
      navigation: new NavigationModel({ role: "applicant" }),
    };
  },

  methods: {
    logout() {
      this.$auth.logout();
    },
  },
};
</script>

