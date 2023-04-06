<template>
  <v-row
    no-gutters
    justify="center"
    class="pa-8 fill-height"
    align-content="center"
    style="background-color: #e9f8f9"
  >
    <v-col cols="12" lg="8" md="10" sm="10">
      <v-card outlined width="100%" style="border-radius: 10px">
        <v-form
          v-model="valid"
          @submit.prevent="signup({ user: applicant, attachments, profile })"
        >
          <v-row no-gutters class="pa-8">
            <v-col cols="12">
              <UserInput :value="applicant">
                <template v-slot:profile>
                  <v-file-input
                    v-model="profile"
                    accept="image/*"
                    label="Profile"
                    dense
                    outlined
                    hint="Optional"
                    :rules="[$rules.acceptImageOnly]"
                  ></v-file-input>
                </template>

                <template v-slot:attachment>
                  <v-file-input
                    v-model="attachments"
                    accept="application/pdf"
                    label="Attachments"
                    dense
                    outlined
                    :rules="[$rules.required]"
                    hint="Required"
                    multiple
                  ></v-file-input>
                </template>
              </UserInput>
            </v-col>
            <v-col cols="12">
              <v-row no-gutters justify="center">
                <v-col cols="12" lg="3" class="pa-2">
                  <v-btn
                    block
                    @click="$router.push({ name: 'sign-up' })"
                    color="primary"
                  >
                    back
                  </v-btn>
                </v-col>
                <v-col cols="12" lg="3" class="pa-2">
                  <v-btn
                    block
                    type="submit"
                    :disabled="!valid"
                    color="#2d3436"
                    class="white--text"
                    >submit</v-btn
                  >
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import UserModel from "~/models/model.user";
import util from "~/plugins/util";
export default {
  mixins: [util],
  layout: "plain",

  mounted() {
    const { type = "" } = this.$route.params;
    if (type == "applicant") {
      this.applicant = new UserModel({
        name: ["Dave", "Quezon", "Lacson", ""],
        organization: "",
        email: "davidbaldonado0811@gmail.com",
        password: "",
        contactNumber: "09874563210",
        dateOfBirth: "2023-01-01",
        address:
          "B30 L2 Emilio Jacinto St. new capitol estates 1 brgy. Batasan hills, Quezon City",
        mother: {
          name: "Emely Lee Quezon",
          contactNumber: "09741852630",
          occupation: "midwife",
        },
        father: {
          name: "Lito Heran Lacson",
          contactNumber: "09632587410",
          occupation: "sanitation inspector",
        },
        gwa: "60kg",
        levelOfEducation: "college",
        collegeCourse: "1st BSIT",
        yearLevel: "",
        existingScholarship: true,
        type: "applicant",
        tin: "",
        background: "",
        profile: "",
        attachments: [],
      });
    }

    if (type == "sponsor") {
      this.applicant = new UserModel({
        name: [],
        organization: "Sponsor A",
        email: "admin@sponsor.com",
        password: "",
        contactNumber: "09753864210",
        dateOfBirth: "",
        address: "sponsor address new sponsor st., Sponsor City",
        mother: { name: "", contactNumber: "", occupation: "" },
        father: { name: "", contactNumber: "", occupation: "" },
        gwa: "",
        levelOfEducation: "",
        collegeCourse: "",
        yearLevel: "",
        existingScholarship: false,
        type: "sponsor",
        tin: "95812350000",
        background:
          "The ABC Foundation is a non-profit organization dedicated to advancing education and academic excellence. We believe that every student deserves access to quality education regardless of their socioeconomic background. Through our scholarship programs, we aim to provide financial assistance to students who demonstrate academic potential, leadership skills, and a commitment to community service. Our mission is to create a world where education is accessible to all, empowering students to achieve their full potential and make a positive impact in their communities and beyond.",
        profile: "",
        attachments: [],
      });
    }
  },

  data() {
    return {
      valid: false,
      applicant: new UserModel({ type: this.$route.params.type }),
      profile: null,
      attachments: [],
    };
  },

  methods: {
    signup({ user = new UserModel(), attachments = [], profile = {} }) {
      this.$store.dispatch("setLoadingProperty", {
        value: true,
        property: "value",
      });
      const json = JSON.stringify(user);
      const blob = new Blob([json], { type: "application/json" });
      const data = new FormData();
      data.append("user", blob);
      for (const attachment of attachments) {
        data.append("file", attachment);
      }

      if (profile && profile.name) {
        data.append("profile", profile);
      }

      this.$axios
        .$post("/user/sign-up", data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(({ message }) => {
          this.$store.dispatch("setNotificationProperty", {
            value: message,
            property: "text",
          });
          this.$store.dispatch("setNotificationProperty", {
            value: true,
            property: "value",
          });
          this.$store.dispatch("setLoadingProperty", {
            value: false,
            property: "value",
          });
          this.$router.push({ name: "index" });
        })
        .catch((error) => {
          this.$store.dispatch("setNotificationProperty", {
            value: error.response.data.error,
            property: "text",
          });
          this.$store.dispatch("setNotificationProperty", {
            value: true,
            property: "value",
          });
          this.$store.dispatch("setLoadingProperty", {
            value: false,
            property: "value",
          });
        });
    },
  },
};
</script>

<style>
</style>